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
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import * as actionTypes from './constants/ActionTypes';
import extensions from './extensions/_expose';
import * as jobs from './middleware/jobs';
import routes from './routes';
import orchestrator from './store/api';
import store, { getState, lastAction, subscribe as storeSubscribe } from './store/index';

render(
  <Provider store={store}>
    {routes}
  </Provider>,
  document.getElementById('root'),
);

/**
 * `window.constructor`
 *
 * Client API for Genetic Constructor, which has major sections:
 *
 * {@link module:constructor.module:api `window.constructor.api`} - API for accessing + mutating Genetic Constructor Data
 *
 * {@link module:constructor.module:extensions `window.constructor.extensions`} - API for extensions
 *
 * {@link module:constructor.module:store `window.constructor.store`} - Event system, lower-level API for data manipulation + access
 *
 * @module constructor
 * @global
 */
const exposed = global.constructor = {};
Object.assign(exposed, {
  extensions,
  jobs,
  constants: {
    actionTypes,
  },
  api: orchestrator,
  store: {
    ...store,
    lastAction,
    subscribe: (callback, callOnSubscribe) => {
      if (callOnSubscribe === true) {
        callback(getState(), lastAction());
      }

      return storeSubscribe(() => {
        callback(getState(), lastAction());
      });
    },
    replaceReducer: () => {}, //hide from 3rd party
  },
});
