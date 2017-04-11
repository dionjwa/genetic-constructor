/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import debug from 'debug';
import JobQueueManager from './JobQueueManager';
import * as jobFiles from '../files/jobs';
import { sequenceWriteManyChunksAndUpdateRollup } from '../data/persistence/sequence';
import { getServerExtensions } from '../extensions/registry';
import {
  FILE_NAME_INPUT,
  FILE_NAME_DATA,
  FILE_NAME_OUTPUT,
  FILE_NAME_RAW_RESULT,
  FILE_NAME_RESULT,
} from '../files/constants';
import Rollup from '../../src/models/Rollup';

/*
 NOTES
 jobs are nested:
 client -> REST -> JobQueueDelegator -> jobQueue[type]

 jobQueue is expected to write to the output, which is then downloaded and saved as the result for the parent (delegator) job

 Task job IDs are just used internally, and all files etc. should be keyed by the delegator job ID

 -

 have a delegator job queue so:
 - unified way to handle jobs in-out
 - all job data + results are qritten to S3 automatically, and provision s3 bucket for them
 - jobs can run remotely, write to s3 etc on their own
 - jobs complete themselves (return a promise)
 - more unified handling of failure / stalling etc.

 CAVEAT handling across queues is kinda lame
 - storing state on server (onJobComplete callback)
 - if server restarts, state is lost. job will restart.
 - (extensions) requires extensions to know about job queue (or import bull directly)
 - (test) how to ensure a processor is set up?
 - (comms) need to listen across all queues, since storing state on server
 - (memory) a promise is required for every job running, between initiate + resolution
 */

//todo - need to durably set slave jobId -- when server restarts if job wasnt complete, the master-slave link is lost, and when a new job starts up, it starts a new slave. The first job never resolves. The client never knew about the second job.

//'jobs' queue used to delegate to other queues (parent job queue)
const delegatorManager = new JobQueueManager('jobs');

const logger = debug('constructor:jobs:processor');

// JOB TRACKING + RESOLUTION

//map jobId (DELEGATOR jobId, not task jobId) to resolve function (which is resolved when job completes)
const jobResolutionMap = {};

/**
 * Attempt to resolve the parent job
 *
 * when job at remote queue finishes, resolve / reject at jobResolutionMap
 * only calls the function if the job is in the map (e.g. more than one instance is up => might be handled at another server)
 *
 * @private
 * @param {UUID} jobId ID of parent job
 * @param {*} result Result of the job... probably a project rollup
 */
const attemptResolveJob = (jobId, result) => {
  if (typeof jobResolutionMap[jobId] === 'function') {
    logger(`delegator: ${jobId} - resolving job`);
    jobResolutionMap[jobId](result);

    //remove reference to handler after we run it... the resolver will still have a reference to it, and allow garbage collect once done
    setTimeout(() => { delete jobResolutionMap[jobId]; });
  }
};

/**
 * Handler when the slave job completes.
 * when the job from the specific queue finishes, do some processing, then call this function.
 * called by attemptResolveJob with `result`
 *
 * Use jobId of parent job, so files are all keyed properly by the parent jobId (task job id is just used internally)
 *
 * @private
 * @param {Job} job the parent job
 * @param {Function} promiseResolver promise resolution function for parent job. can call with result, or error / rejection
 *
 * @param result final result (after processing) for the job
 */
const createSlaveJobCompleteHandler = (job, promiseResolver) => (result) => {
  const { jobId } = job;
  const { projectId } = job.opts;

  // jobs are expected to write their output to the output file
  // we expect this to be a rollup
  const getOutputPromise = jobFiles.jobFileRead(projectId, jobId, FILE_NAME_OUTPUT)
  .catch(() => {
    logger(`slave-handler: ${jobId} - no output file found`);
    return null;
  })
  .then((output) => {
    if (!output) {
      return null;
    }

    logger(`slave-handler: ${jobId} - got output`);
    logger(output);

    try {
      return JSON.parse(output);
    } catch (err) {
      logger(`slave-handler: ${jobId} - error parsing output`);
      logger(output);
      return null;
    }
  });

  //write the raw result (final result is in the final job completion handler)
  //note - may be an error / cause an error stringifying, so try-catch
  const writeResultPromise = jobFiles.jobFileWrite(projectId, jobId, JSON.stringify(result || '', null, 2), FILE_NAME_RAW_RESULT);

  //wait for file write and then return the processed result to the promise resolution
  return writeResultPromise
  .then(() => getOutputPromise)
  .then((result) => {
    const gotRollup = (result && typeof result.blocks === 'object');
    if (gotRollup) {
      try {
        //if got an apparent rollup, validate that the rollup is valid
        Rollup.validate(result, true);
      } catch (err) {
        logger(`slave-handler: ${jobId} - error validating output rollup`);
        throw err;
      }

      if (result.sequences) {
        logger(`slave-handler: ${jobId} - writing sequences...`);
        return sequenceWriteManyChunksAndUpdateRollup(result);
      }
    } else {
      logger(`slave-handler: ${jobId} - got empty result`);
    }
    return result;
  })
  .then((result) => {
    logger(`slave-handler: ${jobId} - resolving!`);
    return promiseResolver(result);
  })
  .catch((err) => {
    console.log('slave-handler: jobCompleteHandler error');
    console.log(err);
    return promiseResolver(Promise.reject(err));
  });
};

// JOB TYPES + QUEUES

const jobTypes = Object.keys(getServerExtensions(manifest => manifest.geneticConstructor.job));

if (process.env.NODE_ENV === 'test') {
  require('./testJobProcessor.js');
  jobTypes.push('test');
}

// map of job type to queue
// one queue per type of extension, expects that the extension has its own queue to process the jobs
// future - dynamic, based on extensions
const jobTypeToQueue = jobTypes.reduce((map, jobType) => {
  const manager = new JobQueueManager(jobType);

  manager.onAddJob((job) => {
    const { parentJobId } = job.opts;
    logger(`slave: [${jobType}] ${parentJobId} (slave: ${job.jobId}) - started`);
  }, true);

  // When the job completes at the appropriate queue, resolve here
  manager.onComplete((job, result) => {
    const { parentJobId } = job.opts;

    logger(`slave: [${jobType}] ${parentJobId} (slave: ${job.jobId}) - complete`);
    // what is returned from the job is actually meaningless, but you might want to log it while developing
    // the job should write to the output file link it is provided
    //logger(result);

    attemptResolveJob(parentJobId, result);
  }, true);

  // Job that was considered stalled. Useful for debugging job workers that crash or pause the event loop.
  manager.queue.on('stalled', (job) => {
    const { parentJobId } = job.opts;

    logger(`slave: [${jobType}] ${parentJobId} (slave: ${job.jobId}) - stalled`);

    attemptResolveJob(parentJobId, Promise.reject(new Error('job stalled')));
  }, true);

  // When the job fails, reject with error
  manager.onFail((job, err) => {
    const { parentJobId } = job.opts;

    logger(`slave: [${jobType}] ${parentJobId} (slave: ${job.jobId}) - failed`);
    logger(err);

    attemptResolveJob(job.jobId, Promise.reject(new Error(err)));
  }, true);

  map[jobType] = manager;
  return map;
}, {});

// JOB HANDLING

delegatorManager.setProcessor((job) => {
  const { jobId } = job;
  const { type, data } = job.data;
  const { projectId } = job.opts;

  logger(`delegator: [${type}] ${jobId} (${projectId}) - processing`);

  const queueManager = jobTypeToQueue[type];

  return new Promise((resolve) => {
    if (!queueManager) {
      console.log(`delegator: task ${type} not recognized, failing`);
      throw new Error(`task ${type} not recognized`);
    }

    // save the data in s3, give url to extension (currently, its the same as the data object passed in)
    return jobFiles.jobFileWrite(projectId, jobId, JSON.stringify(data, null, 2), FILE_NAME_INPUT)
    .then(() => {
      //urls for files the extension is expected to read / write
      const urlInput = jobFiles.jobFileSignedUrl(projectId, jobId, FILE_NAME_INPUT, 'getObject');
      const urlData = jobFiles.jobFileSignedUrl(projectId, jobId, FILE_NAME_DATA, 'putObject');
      const urlOutput = jobFiles.jobFileSignedUrl(projectId, jobId, FILE_NAME_OUTPUT, 'putObject');

      //add a resolution function, for when the job at slave is done
      //this will be called by onComplete for the task job handler, which knows the `parentJobId` from options below
      jobResolutionMap[jobId] = createSlaveJobCompleteHandler(job, resolve);

      //create specific jobId for the slave job, just to help with logging
      const taskJobId = JobQueueManager.createJobId();

      const jobOptions = {
        jobId: taskJobId,
        parentJobId: jobId,
        projectId,
        urlInput,
        urlData,
        urlOutput,
      };

      logger(`delegator: [${type}] creating child:
delegator: ${jobId}
slave: ${taskJobId}
projectId: ${projectId}`);

      //delegate the job
      queueManager.createJob(data, jobOptions);
    });
  })
  .catch((err) => {
    console.log('delegator: job error!', type, jobId, projectId);
    console.log(err);
    attemptResolveJob(jobId, Promise.reject(err));
  });
});

//when jobs in 'jobs' queue complete, save the result
delegatorManager.onComplete((job, result) => {
  const jobId = job.jobId;
  const { type } = job.data;
  const { projectId } = job.opts;

  logger(`delegator: [${type}] ${jobId} (${projectId}) - onComplete`);
  logger(result);

  //save the result in s3, even if it was null / empty
  jobFiles.jobFileWrite(projectId, jobId, JSON.stringify(result || '', null, 2), FILE_NAME_RESULT);
});

//handler for failed jobs
delegatorManager.onFail((job, err) => {
  const jobId = job.jobId;
  const { type } = job.data;
  const { projectId } = job.opts;

  console.log(`delegator: [${type}] ${jobId} (${projectId}) - onFail`);
  console.log(err);
});
