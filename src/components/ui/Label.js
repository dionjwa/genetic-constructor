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

import '../../styles/Label.css';

export default class Label extends Component {
  static propTypes = {
    disabled: PropTypes.bool,
    hover: PropTypes.bool,
    bold: PropTypes.bool,
    onClick: PropTypes.func,
    text: PropTypes.string.isRequired,
    secondary: PropTypes.string,
    styles: PropTypes.object,
    selected: PropTypes.bool,
    selectedAlt: PropTypes.bool,
    textWidgets: PropTypes.array,
    widgets: PropTypes.arrayOf(PropTypes.node),
    showLock: PropTypes.bool,
  };

  static defaultProps = {
    onClick: () => {},
  };

  onClick = evt => this.props.onClick(evt);

  render() {
    let labelClasses = 'label-base';
    if (this.props.bold) {
      labelClasses += ' label-bold';
    }
    if (this.props.disabled) {
      labelClasses += ' label-disabled';
    } else {
      if (this.props.hover) {
        labelClasses += ' label-hover';
      }
      if (this.props.selected) {
        labelClasses += ' label-selected';
      } else {
        labelClasses += ' label-unselected';
      }
      if (this.props.selectedAlt) {
        labelClasses += ' label-selectedAlt';
      }
    }

    return (
      <div style={this.props.styles} className={labelClasses} onClick={this.onClick}>
        <div className="left">
          <div className="primary-enclosure">
            {this.props.showLock ? <div className="lock" /> : null}
            <div className="Label-text">
              <span className="primary" title={this.props.text}>
                {this.props.text}
              </span>
              {!!this.props.secondary && (<span className="secondary">{this.props.secondary}</span>)}
            </div>
          </div>
          {this.props.textWidgets}
        </div>
        <div className="right">
          {this.props.widgets}
        </div>
      </div>
    );
  }
}
