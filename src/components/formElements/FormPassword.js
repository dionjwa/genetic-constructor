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

import FormText from './FormText';
import '../../styles/FormPassword.css';

export default class FormPassword extends Component {
  //extends FormText, has all the same required props
  static propTypes = {
    canShow: PropTypes.bool,
  };

  static defaultProps = {
    canShow: true,
  };

  state = { showPassword: false };

  onToggle = () => {
    this.setState({ showPassword: !this.state.showPassword });

    //pure components cannot have refs, so if FormText is pure, then this.textEl will be null, and we won't be able to focus it
    if (this.textEl) {
      if (this.textEl.node === document.activeElement) {
        this.textEl.focus();
      }
    }
  };

  render() {
    const { canShow, ...rest } = this.props;
    const { showPassword } = this.state;

    return (
      <div className="FormPassword">
        <FormText
          {...rest}
          ref={(el) => { this.textEl = el; }}
          type={showPassword ? 'text' : 'password'}
        />
        {canShow && (
          <div
            className="FormPassword-toggle errorStyle"
            onClick={this.onToggle}
          >
            {showPassword ? 'Hide' : 'Show'}
          </div>
        )}
      </div>
    );
  }
}
