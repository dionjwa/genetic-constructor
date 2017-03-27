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

import { block as blockDragType } from '../../constants/DragTypes';
import { registry } from '../../inventory/registry';
import '../../styles/InventorySearchResultGroup.css';
import InventoryList from './InventoryList';

export default class InventorySearchResultsBySource extends Component {
  static propTypes = {
    searchResults: PropTypes.object.isRequired,
    onItemSelect: PropTypes.func.isRequired,
    onItemDrop: PropTypes.func.isRequired,
    onListGroupAction: PropTypes.func.isRequired,
  };

  handleListGroupAction(evt, key) {
    evt.preventDefault();
    this.props.onListGroupAction(key);
  }

  render() {
    const { searchResults, onItemSelect, onItemDrop } = this.props;

    return (
      <div className="InventorySearchResultGroup">
        {Object.keys(searchResults).map((key) => {
          const name = registry[key].name;
          const results = searchResults[key];
          return (
            <div key={key}>
              <InventoryList
                inventoryType={blockDragType}
                onDrop={item => onItemDrop(key, item)}
                onSelect={item => onItemSelect(key, item)}
                items={results}
                dataAttributePrefix={`searchresult ${name}`}
              />
            </div>
          );
        })}
      </div>
    );
  }
}
