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
import fs from 'fs';
import path from 'path';
import debug from 'debug';
import { pickBy } from 'lodash';
import invariant from 'invariant';

import { manifestIsClient, manifestIsServer, validateManifest } from './manifestUtils';

const logger = debug('constructor:extensions');

const nodeModulesDir = process.env.BUILD ? 'gd_extensions' : path.resolve(__dirname, './node_modules');

const registry = {};

//note - this should include the 'native' extensions -- these wont show up in registry currently

fs.readdirSync(nodeModulesDir).forEach((packageName) => {
  try {
    //skip the test extensions unless we're in the test environment
    if (packageName.startsWith('test') && process.env.NODE_ENV !== 'test') {
      logger(`skipping ${packageName}`);
      return;
    }

    //if we have had an error in npm, log is written, don't try to include it
    //also skip the diretory node modules
    if (packageName === 'npm-debug.log' || packageName === 'node_modules') {
      return;
    }

    logger(`loading ${packageName}...`);

    //future process.env.BUILD support (if not already handled by line above)
    const filePath = path.resolve(nodeModulesDir, `${packageName}/package.json`);
    const depManifest = require(filePath); //eslint-disable-line import/no-dynamic-require

    validateManifest(depManifest);

    Object.assign(registry, {
      [packageName]: depManifest,
    });
  } catch (err) {
    console.warn(`\n\nerror loading extension, omitting: ${packageName}`);
    console.log(err);

    if (!logger.enabled) {
      console.log('(set env var DEBUG=constructor:extensions to see error stack)');
    }
    logger(err.stack);
  }
});

console.log(`[Extensions] Extensions included:${Object.keys(registry)}`);

export const isRegistered = name => Object.prototype.hasOwnProperty.call(registry, name);

//each filter takes arguments (manifest, key), should return true or false
export const getExtensions = (...filters) => filters.reduce((acc, filter) => pickBy(acc, filter), registry);

export const getClientExtensions = (...filters) => getExtensions(manifestIsClient, ...filters);

export const getServerExtensions = (...filters) => getExtensions(manifestIsServer, ...filters);

export const getExtensionInternalPath = (name, fileName) => {
  const extensionPath = path.resolve(__dirname, `./node_modules/${name}`);

  //if no file name is sent, this is likely a malformed request (since multiple files may be present)
  invariant(fileName && typeof fileName === 'string', 'must pass a specific file name');

  return path.resolve(extensionPath, fileName);
};

export default registry;
