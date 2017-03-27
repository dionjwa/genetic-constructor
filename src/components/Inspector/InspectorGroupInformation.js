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
import { connect } from 'react-redux';

import { _getFocused } from '../../selectors/focus';
import '../../styles/InspectorGroupInformation.css';
import InspectorBlock from './InspectorBlock';
import InspectorProject from './InspectorProject';
import InspectorRole from './InspectorRole';

function InspectorGroupInformation(props) {
  const { focused, orders, overrides, type, readOnly, forceIsConstruct, project, construct, userOwnsProject } = props;

  // inspect instances, or construct if no instance or project if no construct or instances
  let inspect;
  switch (type) {
    case 'role' :
      inspect = (<InspectorRole roleId={focused} readOnly />);
      break;
    case 'project':
      inspect = (<InspectorProject
        instance={focused}
        orders={orders}
        readOnly={readOnly}
        userOwnsProject={userOwnsProject}
      />);
      break;
    case 'construct':
    default:
      inspect = (<InspectorBlock
        instances={focused}
        overrides={overrides}
        readOnly={readOnly}
        project={project}
        construct={construct}
        forceIsConstruct={forceIsConstruct}
        userOwnsProject={userOwnsProject}
      />);
      break;
  }

  return <div>{inspect}</div>;
}

InspectorGroupInformation.propTypes = {
  readOnly: PropTypes.bool,
  forceIsConstruct: PropTypes.bool.isRequired,
  userOwnsProject: PropTypes.bool.isRequired,
  type: PropTypes.string.isRequired,
  focused: PropTypes.any.isRequired,
  orders: PropTypes.array.isRequired,
  overrides: PropTypes.object.isRequired,
  project: PropTypes.object,
  construct: PropTypes.object,
};

function mapStateToProps(state, props) {
  const { level, blockIds } = state.focus;

  //delegate handling of focus state handling to selector
  const { type, readOnly, focused } = _getFocused(state, true, props.project.id);

  //handle overrides if a list option
  const overrides = {};
  if (type === 'option') {
    const blockId = state.focus.blockIds[0];
    const block = state.blocks[blockId];
    if (block) {
      Object.assign(overrides, {
        color: block.getColor(),
        role: block.getRole(false),
      });
    }
  }

  const forceIsConstruct = (level === 'construct') ||
    blockIds.some(blockId => props.project.components.indexOf(blockId) >= 0);

  const orders = Object.keys(state.orders)
  .map(orderId => state.orders[orderId])
  .filter(order => order.projectId === props.project.id && order.isSubmitted())
  .sort((one, two) => one.status.timeSent - two.status.timeSent);

  return {
    type,
    readOnly,
    focused,
    forceIsConstruct,
    orders,
    overrides,
  };
}

export default connect(mapStateToProps)(InspectorGroupInformation);
