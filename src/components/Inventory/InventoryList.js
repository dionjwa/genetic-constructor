import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { transact, commit } from '../../store/undo/actions';

import InventoryItem from './InventoryItem';

import '../../styles/InventoryList.css';

export class InventoryList extends Component {
  static propTypes = {
    inventoryType: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
    })).isRequired,
    dataAttributePrefix: PropTypes.string,
    onDrop: PropTypes.func, //passed to items
    onSelect: PropTypes.func, //passed to items
    transact: PropTypes.func,
    commit: PropTypes.func,
  };

  static defaultProps = {
    dataAttributePrefix: '',
  };

  render() {
    const { items, inventoryType, dataAttributePrefix, onDrop, onSelect, transact, commit } = this.props;

    return (
      <div className="InventoryList no-vertical-scroll">
        {items.map(item => {
          return (
            <InventoryItem key={item.id}
                           inventoryType={inventoryType}
                           onDragStart={transact}
                           onDragComplete={commit}
                           onDrop={onDrop}
                           onSelect={onSelect}
                           item={item}
                           dataAttribute={`${dataAttributePrefix} ${item.id}`}/>
          );
        })}
      </div>
    );
  }
}

export default connect(() => ({}), {
  transact,
  commit,
})(InventoryList);
