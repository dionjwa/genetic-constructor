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
import express from 'express';
import _, { merge } from 'lodash';

import Order from '../../src/models/Order';
import saveCombinations from '../../src/utils/generators/orderConstructs';
import { pruneUserObject } from '../user/utils';
import { dbPruneResult } from '../data/middleware/db';
import { projectIdParamAssignment, userOwnsProjectMiddleware } from './../data/permissions';
import * as orderPersistence from './../data/persistence/orders';
import * as projectVersions from './../data/persistence/projectVersions';
import * as projectPersistence from './../data/persistence/projects';
import * as snapshots from './../data/persistence/snapshots';
import { errorDoesNotExist, errorInvalidModel } from '../errors/errorConstants';
import { submit, validate } from './egf';
import { submit as testSubmit, validate as testValidate } from './test';

const router = express.Router(); //eslint-disable-line new-cap
const logger = debug('constructor:order');

router.param('projectId', projectIdParamAssignment);

const validateOrderMiddleware = (req, res, next) => {
  const { user } = req;

  const { foundry, order, positionalCombinations } = req.body;
  if (order.status.foundry && order.status.remoteId) {
    logger(`[Middleware] order already submitted: ${order.id} `);
    return res.status(422).send('cannot submit an already submitted order');
  }

  if (!Order.validateSetup(order)) {
    logger(`[Middleware] setup invalid: ${order.id}`);
    return res.status(422).send('error validating order setup');
  }

  //future - this should be dynamic, based on the foundry, pulling from a registry
  if (!(foundry === 'egf' || (process.env.NODE_ENV === 'test' && foundry === 'test'))) {
    return res.status(501).send('foundry must be EGF');
  }

  const prunedUser = pruneUserObject(user);

  //implicitly check that project @ version exists
  //implicitly ensures that all blocks are valid, since written projects are validated
  const getPromise = Number.isInteger(order.projectVersion) ?
    projectVersions.projectVersionGet(order.projectId, order.projectVersion) :
    projectPersistence.projectGet(order.projectId);

  getPromise
  .then((rollup) => {
    //block on sample project
    if (rollup.project.rules.frozen) {
      res.status(422);
      return next('Cannot order sample project');
    }

    const projectVersion = rollup.project.version;

    const constructNames = order.constructIds.map(constructId => rollup.blocks[constructId].metadata.name || 'Untitled Construct');

    merge(order, {
      user: user.uuid,
      projectVersion,
      metadata: {
        constructNames,
      },
    });

    logger('[Middleware] Order valid, generating combinations...');

    //note - this code is not very memory efficient and should be optimized more

    //todo - compute positionalCombinations here, not as part of POST
    //should make sure that all positional combinations are defined

    //generate combinations, given positonalCombinations
    let allConstructs = [];
    order.constructIds.forEach((constructId) => {
      const constructPositionalCombinations = positionalCombinations[constructId];
      allConstructs = allConstructs.concat(saveCombinations(constructPositionalCombinations));
    });

    //prune the list based on the parameters
    const constructListStrings = (!order.parameters.onePot && order.parameters.permutations < order.numberCombinations) ?
      Object.keys(order.parameters.activeIndices).map(index => allConstructs[index]) :
      allConstructs;

    //convert to normal object now that we have the smaller size (hopefully)
    //const constructList = _.map(constructListStrings, JSON.parse);

    Object.assign(req, {
      order,
      rollup,
      foundry,
      projectVersion,
      prunedUser,
      numberPermutations: allConstructs.length, //assigning allConstructs directly to req eats memory
      constructList: constructListStrings,
    });

    next();
  })
  .catch((err) => {
    console.log('[Order Middleware]', err, err.stack);
    res.status(500).send(err);
  });
};

router.post('/validate', validateOrderMiddleware, (req, res, next) => {
  const { order, rollup, prunedUser, foundry, constructList } = req;

  logger(`[Validate] order ${order.id} @ foundry ${foundry}`);

  //future - submit should be dynamic, based on the foundry, pulling from a registry

  const validatePromise = (process.env.NODE_ENV === 'test' && foundry === 'test') ?
    testValidate(order, prunedUser, constructList, rollup) :
    validate(order, prunedUser, constructList, rollup);

  validatePromise
  .then(() => {
    res.status(200).send(true);
  })
  .catch((err) => {
    logger(`[Validate] error validating order ${order.id} at ${foundry}`);
    logger(err);
    res.status(422).send(err);
  });
});

router.route('/:projectId/:orderId?')
.all(userOwnsProjectMiddleware)
.get((req, res, next) => {
  const { user, projectId } = req; //eslint-disable-line no-unused-vars
  const { orderId } = req.params;

  if (orderId) {
    return orderPersistence.orderGet(orderId)
    .then(order => res.status(200).json(order))
    .catch(err => next(err));
  }

  return orderPersistence.orderList(projectId)
  .then(orders => res.status(200).json(orders))
  .catch((err) => {
    if (err === errorDoesNotExist) {
      return res.status(200).json([]);
    }
    next(err);
  });
})
.post(validateOrderMiddleware, (req, res, next) => {
  /* order flow:
   - validation
   - get project @ version (latest if no version specified)
   - generate combinatorials
   - submit the order to the foundry
   - create snapshot with type order
   - return order to client
   */

  const { order, rollup, projectVersion, user, prunedUser, projectId, foundry, numberPermutations, constructList } = req;

  if (projectId !== order.projectId) {
    return res.status(422).send('project ID and order.projectId must match');
  }

  logger(`
Order request:
Order ID ${order.id}
Project ID ${order.projectId}
Project Version ${order.projectVersion}
Constructs ${order.constructIds.join(', ')}
User ${user.uuid}
`);

  //future - submit should be dynamic, based on the foundry, pulling from a registry

  const submissionPromise = (process.env.NODE_ENV === 'test' && foundry === 'test') ?
    testSubmit(order, prunedUser, constructList, rollup) :
    submit(order, prunedUser, constructList, rollup);

  return submissionPromise
  .catch((err) => {
    //probably want more consistent error handling across foundries, once we add more + decide how they are integrated

    logger(`[Submit] ${order.id} - ERROR: Submission failed to ${foundry}`);
    logger(err);
    return Promise.reject(errorInvalidModel);
  })
  .then(orderResponse =>
    //check if we have a snapshot, create if we dont / merge if do
    snapshots.snapshotGet(projectId, projectVersion)
    //on failure, assume the snapshot doesnt exist, and we want to create a new one
    .catch((err) => {
      logger(`[Submit] ${order.id} - No existing snapshot found, creating new one...`);
      return null;
    })
    .then((snapshot) => {
      //use shallow, easy to merge keys...
      //possible that multiple orders happen at the same snapshot
      const snapshotTags = order.constructIds.reduce((acc, id) => Object.assign(acc, { [id]: true }),
        {
          foundry,
          orderId: order.id,
          [order.id]: true,
          [foundry]: true,
          [orderResponse.jobId]: true,
        });
      let message = `Order ${order.id} @ ${foundry}: ${order.metadata.constructNames.join(' ')}`;
      const keywords = order.metadata.keywords || [];

      //merge tags if snapshot existed
      if (snapshot) {
        merge(snapshotTags, snapshot.tags);
        message = `${snapshot.message} | ${message}`;
        keywords.push(..._.difference(snapshot.keywords, keywords));
      }

      const snapshotBody = {
        message,
        tags: snapshotTags,
        keywords,
      };

      logger(`[Submit] ${order.id} Writing snapshot`);
      logger(snapshotBody);

      //write or update the snapshot (handle the update above)
      return snapshots.snapshotWrite(projectId, user.uuid, projectVersion, snapshotBody, snapshots.SNAPSHOT_TYPE_ORDER)
      .then((snapshot) => {
        merge(order, {
          status: {
            foundry,
            numberPermutations,
            numberOrdered: constructList.length,
            orderResponse,
            remoteId: orderResponse.jobId,
            price: orderResponse.cost,
            timeSent: Date.now(),
          },
        });

        logger(`[Submit] ${order.id} Saving...`);

        //if we hit a validation error while writing at this point, our fault
        return orderPersistence.orderWrite(order.id, order, user.uuid)
        .then(dbPruneResult);
      });
    }))
  .then(order => res.status(200).send(order))
  .catch((err) => {
    logger('[Submit] Order failed:');
    logger(err);
    logger(err.stack);

    if (err === errorInvalidModel) {
      return res.status(422).send(errorInvalidModel);
    }

    if (err === errorDoesNotExist) {
      return res.status(404).send(errorDoesNotExist);
    }

    res.status(500).send(err);
  });
});

export default router;
