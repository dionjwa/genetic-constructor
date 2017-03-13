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
import JobManager from './JobManager';

// job handler for test environment, just returns the data passed in

const jobManager = new JobManager('test');

jobManager.setProcessor((job) => {
  try {
    job.progress(100);
    return Promise.resolve(job.data);
  } catch (err) {
    console.log(err);
    console.log(err.stack);
    throw err;
  }
});
