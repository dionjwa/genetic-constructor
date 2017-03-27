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

//use this in our custom forms just as you would use an input element
//wraps in our custom styling

import '../../styles/FormText.css';

export default function FormText(props) {
  const { className, useTextarea, transparent, ...rest } = props;

  const classes = ['formElement', 'FormText', 'errorStyle'];
  if (className) {
    classes.push(className);
  }
  if (transparent) {
    classes.push('transparent');
  }

  const classNames = classes.join(' ');

  if (useTextarea === true) {
    return (
      <textarea
        rows="2"
        className={classNames}
        {...rest}
      />
    );
  }

  return (
    <input
      type="text"
      className={classNames}
      {...rest}
    />
  );
}

FormText.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  transparent: PropTypes.bool,
  useTextarea: PropTypes.bool,
};
