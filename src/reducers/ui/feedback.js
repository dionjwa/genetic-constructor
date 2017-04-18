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
import * as ActionTypes from '../../constants/ActionTypes';

export const initialState = {
  anon: false,
  text: '',
  toIndex: 0,
  stars: 0,
};

export default function feedback(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.UI_FEEDBACK_TEXT_CHANGE:
      return Object.assign({}, state, {
        text: action.text,
      });

    case ActionTypes.UI_FEEDBACK_ANON_TOGGLE:
      return Object.assign({}, state, {
        anon: !state.anon,
      });

    case ActionTypes.UI_FEEDBACK_TO_INDEX_CHANGE:
      return Object.assign({}, state, {
        toIndex: action.toIndex,
      });

    case ActionTypes.UI_FEEDBACK_STARS_CHANGE:
      return Object.assign({}, state, {
        stars: action.stars,
      });

    default:
      return state;
  }
}
