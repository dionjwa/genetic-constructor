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
import React, { PropTypes } from 'react';

import '../../styles/ordermodal.css';

export default function Checkbox(props) {
  return (
    <div className="row-checkbox">
      <input
        onChange={(evt) => { props.onChange(evt.target.checked); }}
        type="checkbox"
        disabled={props.disabled}
        checked={props.value}
      />
      {props.label}
    </div>
  );
}

Checkbox.propTypes = {
  value: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};
