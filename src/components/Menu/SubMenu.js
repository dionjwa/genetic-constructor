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
 limitations under the License..
 */
import React, { PropTypes } from 'react';

import MenuItem from './MenuItem';
import MenuSeparator from './MenuSeparator';

export default function SubMenu(props) {
  return (
    <div
      className={props.className}
      style={props.position}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      {props.menuItems.map((item, index) => {
        const boundAction = (evt) => {
          if (!item.disabled && item.action) {
            item.action();
            props.close();
          }
        };
        return (
          item.text ?
            (<MenuItem
              key={item.text}
              text={item.text}
              shortcut={item.shortcut}
              checked={item.checked}
              disabled={!!item.disabled}
              classes={item.classes}
              action={boundAction}
              menuItems={item.menuItems}
              close={props.close}
              openLeft={props.openLeft}
            />) :
            (<MenuSeparator key={index} />)
        );
      })}
    </div>
  );
}

SubMenu.propTypes = {
  close: PropTypes.func.isRequired, //eslint-disable-line react/no-unused-prop-types
  menuItems: PropTypes.array.isRequired,
  position: PropTypes.object,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  className: PropTypes.string,
  openLeft: PropTypes.bool,
};

SubMenu.defaultProps = {
  onMouseLeave: () => {},
  onMouseEnter: () => {},
};
