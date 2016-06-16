import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import SceneGraph2D from '../../containers/graphics/scenegraph2d/scenegraph2d';
import Layout from '../../containers/graphics/views/layout';

import '../../../src/styles/ordermodal.css';
import '../../../src/styles/SceneGraphPage.css';

class ConstructPreview extends Component {

  static propTypes = {};

  constructor() {
    super();
    this.state = {
      index: 1,
    };
  }

  get dom() {
    return ReactDOM.findDOMNode(this);
  }

  get sceneGraphEl() {
    return this.dom.querySelector('.scenegraph');
  }

  get containerEl() {
    return this.dom.querySelector('.container');
  }

  /**
   * construct scene graph and layout once mounted
   * @return {[type]} [description]
   */
  componentDidMount() {
    // create the scene graph we are going to use to display the construct
    this.sg = new SceneGraph2D({
      width: this.dom.clientWidth,
      height: this.dom.clientHeight,
      availableWidth: this.dom.clientWidth,
      availableHeight: this.dom.clientHeight,
      parent: this.sceneGraphEl,
    });
    // create the layout object
    this.layout = new Layout(this, this.sg, {
      showHeader: false,
      insetX: 10,
      insetY: 10,
      baseColor: 'lightgray',
    });
  }

  componentDidUpdate() {
    if (this.props.constructs.length) {
      this.containerEl.scrollTop = 0;
      const construct = this.props.constructs[this.state.index - 1];
      const constructIndex = construct.index;
      const componentIds = construct.componentIds;
      this.layout.update({
        construct: {
          metadata: {
            color: 'lightgray',
          },
          components: componentIds,
          // this fake construct should not be a template, so we don't get empty list block placeholders
          isTemplate: () => {return false;},
        },
        blocks: this.props.blocks,
        currentBlocks: [],
        currentConstructId: constructIndex,
      });
      this.sg.update();
    }
  }

  onChangeConstruct = (evt) => {
    const index = parseInt(evt.target.value, 10);
    this.setState({ index: Number.isInteger(index) ? Math.min(this.props.constructs.length, Math.max(1, index)) : 1 });
  };

  render() {
    const label = `of ${this.props.constructs.length} combinations`;
    return (
      <div className="preview">
        <label>Reviewing assembly</label>
        <input
          className="input-updown"
          type="number"
          defaultValue="1"
          min="1"
          max={this.props.constructs.length}
          onChange={this.onChangeConstruct}
        />
        <label>{label}</label>
        <div className="container">
          <div className="scenegraph"></div>
        </div>
      </div>
    );
  }
}

//todo- it would be wonderful if the index was a property on this, so that only one needed to be loaded in
//break up construct preview so that the input and the preview element are separate and pass the index as a prop to this component, so that you can just pass "construct" instead of "constructs"
function mapStateToProps(state, props) {
  return {
    constructs: props.order.constructs,
    blocks: state.blocks,
  };
}

export default connect(mapStateToProps)(ConstructPreview);
