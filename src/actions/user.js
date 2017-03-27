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
/**
 * @module Actions_User
 * @memberOf module:Actions
 *
 * @private
 */
//This module is not exported on the window, so marked as private
import * as ActionTypes from '../constants/ActionTypes';
import { login, logout, register, setUserConfig, updateAccount } from '../middleware/auth';

const mapUserFromServer = serverUser => ({
  userid: serverUser.uuid,
  firstName: serverUser.firstName,
  lastName: serverUser.lastName,
  email: serverUser.email,
  config: serverUser.config || {},
});

/*
 * user = { userid, email, firstName, lastName }
 */
const _userSetUser = user => ({
  type: ActionTypes.USER_SET_USER,
  updateConfig: true,
  user,
});

/**
 * identify user to heap analytics
 */
const identifyUser = (email) => {
  if (window && window.heap && window.heap.identify) {
    window.heap.identify(email);
  }
};

//Promise
export const userLogin = (email, password) => (dispatch, getState) => login(email, password)
      .then((user) => {
        const mappedUser = mapUserFromServer(user);
        identifyUser(mappedUser.email);
        const setUserPayload = _userSetUser(mappedUser);
        dispatch(setUserPayload);
        return mappedUser;
      });

//Promise
//only reset store if arg set to false, so that minimize code execution and wait for window to change location
export const userLogout = (onlyRedirect = true) => (dispatch, getState) => logout()
      .then(() => {
        window.location = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
        if (!onlyRedirect) {
          //also reset the user in case the window doesn't change. pass-through for tests
          const setUserPayload = _userSetUser({});
          dispatch(setUserPayload);
          return true;
        }
      });

//Promise
////email, password, firstName, lastName
//config is configuration JSON for initial projects + extensions
export const userRegister = (user, config) => (dispatch, getState) => register(user, config)
      .then((user) => {
        const mappedUser = mapUserFromServer(user);
        identifyUser(mappedUser.email);
        const setUserPayload = _userSetUser(mappedUser);
        dispatch(setUserPayload);
        return user;
      });

export const userUpdate = user => (dispatch, getState) => updateAccount(user)
      .then((user) => {
        const mappedUser = mapUserFromServer(user);
        identifyUser(mappedUser.email);
        const setUserPayload = _userSetUser(mappedUser);
        dispatch(setUserPayload);
        return user;
      });

export const userUpdateConfig = config => (dispatch, getState) => setUserConfig(config)
      .then((config) => {
        const user = Object.assign({}, getState().user, { config });
        const setUserPayload = _userSetUser(user);
        dispatch(setUserPayload);
        return user;
      });
