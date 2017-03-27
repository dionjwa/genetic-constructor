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
import moment from 'moment';
import invariant from 'invariant';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import { orderList } from '../../actions/orders';
import { uiShowOrderForm } from '../../actions/ui';
import Spinner from '../ui/Spinner';
import Expando from '../ui/Expando';
import InspectorDetailSection from './InspectorDetailSection';

import '../../styles/InspectorGroupOrders.css';

class InspectorGroupOrders extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    project: PropTypes.object.isRequired,
    userOwnsProject: PropTypes.bool.isRequired,
    orders: PropTypes.object.isRequired,
    orderList: PropTypes.func.isRequired,
    uiShowOrderForm: PropTypes.func.isRequired,
  };

  state = {
    orders: [],
    loaded: false,
  };

  componentDidMount() {
    this.setOrders(this.props.orders, this.props.projectId);

    if (this.props.userOwnsProject) {
      //might have already fetched them, but lets double check fetch again
      this.props.orderList(this.props.projectId)
      .then(() => {
        this.setOrders(this.props.orders, this.props.projectId);
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.projectId !== nextProps.projectId || this.props.orders !== nextProps.orders) {
      this.setOrders(nextProps.orders, nextProps.projectId);
    }
  }

  setOrders(orders, projectId) {
    invariant(orders && projectId, 'must pass orders and projectId');

    this.setState({
      loaded: true,
      orders: _(orders)
      .filter(order => order.projectId === projectId && order.isSubmitted())
      .orderBy([order => order.dateSubmitted()], ['desc'])
      .value(),
    });
  }

  render() {
    const { loaded, orders } = this.state;

    if (!loaded && !orders.length) {
      return <Spinner />;
    }

    //default, no orders
    let content = (<div className="InspectorContentPlaceholder">No orders found</div>);

    if (!this.props.userOwnsProject) {
      content = (<div className="InspectorContentPlaceholder">Cannot view orders of a published project</div>);
    } else if (orders.length) {
      content = orders.map((order, index) => {
        const items = [
          {
            key: 'Project',
            value: this.props.project.metadata.name || 'Unnamed Project',
          }, {
            key: 'Order Created',
            value: moment(order.metadata.created).format('D MMM YYYY H:mm:s'),
          },
          {
            key: 'Foundry',
            value: order.status.foundry,
          },
          {
            key: 'Remote ID',
            value: order.status.remoteId,
          },
          {
            key: 'Time Sent',
            value: moment(order.status.timeSent).format('D MMM YYYY H:mm:s'),
          }, {
            key: 'Order Details',
            value: (
              <a
                className="link"
                onClick={(event) => {
                  event.preventDefault();
                  this.props.uiShowOrderForm(true, order.id);
                }}
              >
                Review Order
              </a>
            ),
          },
        ];
        const orderContent = <InspectorDetailSection items={items} />;

        return (
          <Expando
            key={order.id}
            text={order.metadata.name}
            secondary={moment(order.status.timeSent).format('D MMM YYYY H:mm:s')}
          >
            {orderContent}
          </Expando>
        );
      });
    }

    return (
      <div className="InspectorGroupOrders">
        {content}
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    project: state.projects[props.projectId],
    orders: state.orders,
  };
}

export default connect(mapStateToProps, {
  uiShowOrderForm,
  orderList,
})(InspectorGroupOrders);
