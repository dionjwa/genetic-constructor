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
import React, { Component, PropTypes } from 'react';

import '../../styles/Arrow.css';

export default class Arrow extends Component {
  static propTypes = {
    // ['up', 'down', 'left', 'right']
    direction: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    hidden: PropTypes.bool,
  };

  onClick = (evt) => {
    if (this.props.onClick && !this.props.hidden && !this.props.disabled) {
      this.props.onClick(evt);
    }
  };

  render() {
    let arrowClasses = `Arrow ${this.props.hidden ? 'Arrow-hidden' : ''}`;
    if (this.props.disabled) {
      arrowClasses += ' Arrow-disabled';
    }
    arrowClasses += ` Arrow-${this.props.direction}`;
    if (this.props.onClick) {
      arrowClasses += ' Arrow-clickable';
    }

    return (
      <div className={arrowClasses} onClick={this.onClick} />
    );
  }
}
