import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import SceneGraph2D from '../scenegraph2d/scenegraph2d';
import Vector2D from '../geometry/vector2d';
import Layout from './layout.js';
import PopupMenu from '../../../components/Menu/PopupMenu';
import { connect } from 'react-redux';
import {
  blockCreate,
  blockDelete,
  blockDetach,
  blockAddComponent,
  blockAddComponents,
  blockClone,
  blockSetSbol,
  blockAddSbol,
  blockRename,
  blockRemoveComponent,
} from '../../../actions/blocks';
import {
  uiShowDNAImport,
  uiToggleDetailView,
  inspectorToggleVisibility
} from '../../../actions/ui';
import {
  blockGetParents,
} from '../../../selectors/blocks';

import { sbol as sbolDragType } from '../../../constants/DragTypes';
import debounce from 'lodash.debounce';
import UserInterface from './constructvieweruserinterface';
import {
  focusBlocks,
  focusBlocksAdd,
  focusBlocksToggle,
  focusConstruct,
} from '../../../actions/focus';
import invariant from 'invariant';
import {
  projectGetVersion,
} from '../../../selectors/projects';
import { projectRemoveConstruct } from '../../../actions/projects';

// static hash for matching viewers to constructs
const idToViewer = {};

export class ConstructViewer extends Component {

  static propTypes = {
    projectId: PropTypes.string.isRequired,
    construct: PropTypes.object.isRequired,
    constructId: PropTypes.string.isRequired,
    layoutAlgorithm: PropTypes.string.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    focusBlocks: PropTypes.func.isRequired,
    focusBlocksAdd: PropTypes.func.isRequired,
    focusBlocksToggle: PropTypes.func.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    currentBlock: PropTypes.array,
    blockSetSbol: PropTypes.func,
    blockCreate: PropTypes.func,
    blockGetParent: PropTypes.func,
    blockClone: PropTypes.func,
    blockAddComponent: PropTypes.func,
    blockAddComponents: PropTypes.func,
    blockDetach: PropTypes.func,
    uiShowDNAImport: PropTypes.func,
    blockRemoveComponent: PropTypes.func,
    blockGetParents: PropTypes.func,
    blockAddSbol: PropTypes.func,
    projectGetVersion: PropTypes.func,
    projectRemoveConstruct: PropTypes.func,
    blocks: PropTypes.object,
    focus: PropTypes.object,
    constructPopupMenuOpen: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    idToViewer[this.props.constructId] = this;
    this.state = {
      blockPopupMenuOpen: false,     // context menu for blocks
      constructPopupMenuOpen: false, // context menu for construct
      menuPosition: new Vector2D(),  // position for any popup menu,
      modalOpen: false,              // controls visibility of test modal window
    };
    this.update = debounce(this._update.bind(this), 1);
  }

  /**
   * setup the scene graph and layout component.
   */
  componentDidMount() {
    // create the scene graph we are going to use to display the construct
    this.sg = new SceneGraph2D({
      width: this.dom.clientWidth,
      height: this.dom.clientHeight,
      availableWidth: this.dom.clientWidth,
      availableHeight: this.dom.clientHeight,
      parent: this.sceneGraphEl,
      userInterfaceConstructor: UserInterface,
    });
    // create the layout object
    this.layout = new Layout(this, this.sg, {
      layoutAlgorithm: this.props.layoutAlgorithm,
    });
    // the user interface will also need access to the layout component
    this.sg.ui.layout = this.layout;
    // getting more ugly, the UI needs access to ourselves, the constructviewer
    this.sg.ui.constructViewer = this;
    // initial render won't call componentDidUpdate so force an update to the layout/scenegraph
    this.update();
    // handle window resize to reflow the layout
    this.resizeDebounced = debounce(this.windowResized.bind(this), 5);
    window.addEventListener('resize', this.resizeDebounced);

    // if there is no focused construct then we should grab it
    // NOTE: For now this is disabled because it often does not product the desired result
    // and can move the page beyind the scroll limits set.
    if (!this.props.focus.constructId) {
      this.props.focusConstruct(this.props.constructId);
      //ReactDOM.findDOMNode(this).scrollIntoView();
    } else {
      //ReactDOM.findDOMNode(this).scrollIntoView();
    }
  }

  shouldComponentUpdate(props, nextProps) {
    // console.log(`CT:${this.props.construct.id}, ${props.construct !== nextProps.construct}`);
    // return props.construct !== nextProps.construct;
    return true;
  }

  /**
   * scroll into view if needed and update scenegraph
   * @param  {[type]} prevProps [description]
   * @return {[type]}           [description]
   */
  componentDidUpdate(prevProps) {
    // if we are newly focused then scroll ourselves into view
    // const oldFocus = prevProps.construct.id === prevProps.focus.construct;
    // const newFocus = this.props.construct.id === this.props.focus.construct;
    // if (!oldFocus && newFocus) {
    //   const dom = ReactDOM.findDOMNode(this);
    //   dom.scrollIntoView();
    // }
    this.update();
  }

  /**
   * ensure we don't get any resize events after dismounting
   */
  componentWillUnmount() {
    delete idToViewer[this.props.constructId];
    this.resizeDebounced.cancel();
    window.removeEventListener('resize', this.resizeDebounced);
  }

  /**
   * given a construct ID return the current viewer if there is one
   */
  static getViewerForConstruct(id) {
    return idToViewer[id];
  }

  /**
   * get the parent of the given block, which is either the construct or the parents
   * of the block if a nested construct.
   *
   */
  getBlockParent(blockId) {
    const parents = this.props.blockGetParents(blockId);
    invariant(parents && parents.length, 'blocks are expected to have parents');
    return parents[0];
  }

  /**
   * remove the given block, which we assume if part of our construct and
   * return the scenegraph node that was representing it.
   */
  removePart(partId) {
    this.props.blockDetach(partId);
  }

  /**
   * remove all parts in the list
   */
  removePartsList(partList) {
    this.props.blockDetach(...partList);
  }

  /**
   * rename one of our blocks
   * @param  {[type]} blockId [description]
   * @param  {[type]} newName [description]
   * @return {[type]}         [description]
   */
  blockRename(blockId, newName) {

  }

  /**
   * select the given block
   */
  constructSelected(id) {
    this.props.focusConstruct(id);
  }

  /**
   * select the given block
   */
  blockSelected(partIds) {
    this.props.focusBlocks(partIds);
  }

  /**
   * select the given block
   */
  blockToggleSelected(partIds) {
    this.props.focusBlocksToggle(partIds);
  }

  /**
   * add the given part by ID to the selections
   */
  blockAddToSelections(partIds) {
    this.props.focusBlocksAdd(partIds);
  }

  /**
   * Join the given block with any other selected block in the same
   * construct level and select them all
   */
  blockAddToSelectionsRange(partId, currentSelections) {
    // get all the blocks at the same level as this one
    const levelBlocks = (this.props.blockGetParents(partId)[0]).components;
    // find min/max index of these blocks if they are in the currentSelections
    let min = levelBlocks.indexOf(partId);
    let max = min;
    currentSelections.forEach((blockId, index) => {
      const blockIndex = levelBlocks.indexOf(blockId);
      if (blockIndex >= 0) {
        min = Math.min(min, blockIndex);
        max = Math.max(max, blockIndex);
      }
    });
    // now we can select the entire range
    this.props.focusBlocksAdd(levelBlocks.slice(min, max + 1));
  }

  /**
   * window resize, update layout and scene graph with new dimensions
   * @return {[type]} [description]
   */
  windowResized() {
    this.sg.availableWidth = this.dom.clientWidth;
    this.sg.availableHeight = this.dom.clientHeight;
    this.forceUpdate();
  }

  /**
   * accessor for our DOM node.
   * @return {[type]} [description]
   */
  get dom() {
    return ReactDOM.findDOMNode(this);
  }

  /**
   * accessor that fetches the actual scene graph element within our DOM
   * @return {[type]} [description]
   */
  get sceneGraphEl() {
    return this.dom.querySelector('.sceneGraph');
  }

  /**
   * update the layout and then the scene graph
   */
  _update() {
    //console.time(`LAYOUT`);
    this.layout.update(
      this.props.construct,
      this.props.layoutAlgorithm,
      this.props.blocks,
      this.props.focus.blockIds,
      this.props.focus.constructId);
    //console.timeEnd(`LAYOUT`);
    //console.time('GRAPH');
    this.sg.update();
    //console.timeEnd('GRAPH');
    //console.time('UI');
    this.sg.ui.update();
    //console.timeEnd('UI');
  }

  /**
   * close all popup menus
   */
  closePopups() {
    this.setState({
      blockPopupMenuOpen: false,
      constructPopupMenuOpen: false,
    });
  }

  /**
   * open any popup menu by apply the appropriate state and global position
   */
  openPopup(state) {
    this.setState(state);
  }

  /**
   * open the inspector
   * @return {[type]} [description]
   */
  openInspector() {
    this.props.inspectorToggleVisibility(true);
  }

  /**
   * menu items for blocks context menu, can get merged with construct context menu
   */
  blockContextMenuItems = () => {
    return [
      {
        text: 'Inspect Block',
        disabled: this.props.focus.blockIds.length !== 1,
        action: () => {
          this.openInspector();
        },
      },
      {
        text: 'Delete Blocks',
        action: () => {
          this.removePartsList(this.sg.ui.selectedElements);
        },
      },
      {
        text: 'Import DNA Sequence',
        disabled: this.props.focus.blockIds.length !== 1,
        action: () => {
          this.props.uiShowDNAImport(true);
        },
      },
    ];
  };

  /**
   * return JSX for block construct menu
   */
  blockContextMenu() {
    return (<PopupMenu
      open={this.state.blockPopupMenuOpen}
      position={this.state.menuPosition}
      closePopup={this.closePopups.bind(this)}
      menuItems={this.blockContextMenuItems()}/>);
  }

  /**
   * menu items for the construct context menu
   */
  constructContextMenuItems = () => {
    return [
      {
        text: 'Inspect Construct',
        action: () => {
          this.openInspector();
          this.props.focusBlocks([]);
          this.props.focusConstruct(this.props.constructId);
        },
      },
      {
        text: 'Delete Construct',
        action: () => {
          this.props.projectRemoveConstruct(this.props.projectId, this.props.constructId);
        },
      },
    ];
  };

  /**
   * return JSX for construct context menu
   */
  constructContextMenu() {
    // add the blocks context menu items if there are selected blocks
    let items = this.constructContextMenuItems();
    if (this.props.focus.blockIds.length) {
      items = [...items, {}, ...this.blockContextMenuItems()];
    }

    return (<PopupMenu
      open={this.state.constructPopupMenuOpen}
      position={this.state.menuPosition}
      closePopup={this.closePopups.bind(this)}
      menuItems={items}/>);
  }

  /**
   * add the given item using an insertion point from the constructviewer user interface.
   * Insertion point may be null, in which the block is added at the end
   */
  addItemAtInsertionPoint(payload, insertionPoint, event) {
    const { item, type } = payload;
    let index;
    // get the immediate parent ( which might not be the top level block if this is a nested construct )
    let parent = insertionPoint ? this.getBlockParent(insertionPoint.block) : this.props.construct;
    if (type === sbolDragType) {
      // insert next to block, inject into a block, or add as the first block of an empty construct
      if (insertionPoint) {
        if (insertionPoint.edge) {
          // create new block
          const block = this.props.blockCreate({ rules: { sbol: item.id } });
          // get index of insertion allowing for the edge closest to the drop if provided
          index = parent.components.indexOf(insertionPoint.block) + (insertionPoint.edge === 'right' ? 1 : 0);
          // add
          this.props.blockAddComponent(parent.id, block.id, index);
          // return the newly created block or the block dropped on
          return [block.id];
        }
        // drop on existing block
        const newBlock = this.props.blockAddSbol(insertionPoint.block, item.id);
        return [newBlock.id];
      }
      // create new block
      const block = this.props.blockCreate({ rules: { sbol: item.id } });
      // the construct must be empty, add as the first child of the construct
      this.props.blockAddComponent(parent.id, block.id, 0);
      return [block.id];
    }

    // this will become the new blocks we are going to insert, declare here first
    // in case we do a push down
    const newBlocks = [];

    // if no edge specified then the parent becomes the target block and index is simply
    // the length of components to add them at the end of the current children
    if (insertionPoint && !insertionPoint.edge) {
      const oldParent = parent;
      parent = this.props.blocks[insertionPoint.block];
      index = parent.components.length;
      // if the block we are targeting already has a sequence then we will replace it with a new empty
      // block, then insert the old block at the start of the payload so it is added as a child to the new block
      if (parent.hasSequence()) {
        // create new block and replace current parent
        const block = this.props.blockCreate();
        const replaceIndex = oldParent.components.indexOf(parent.id);
        invariant(replaceIndex >= 0, 'expect to get an index here');
        this.props.blockRemoveComponent(oldParent.id, parent.id);
        this.props.blockAddComponent(oldParent.id, block.id, replaceIndex);
        // seed new blocks with the old target block
        newBlocks.push(parent.id);
        // bump the index
        index += 1;
        // now make parent equal to the new block so blocks get added to it.
        parent = block;
      }
    } else {
      index = parent.components.length;
      if (insertionPoint) {
        index = parent.components.indexOf(insertionPoint.block) + (insertionPoint.edge === 'right' ? 1 : 0);
      }
    }

    // if the source is the inventory and we are dragging a single block with components
    // then we don't want to insert the parent, so replace the payload with just the children
    if (!Array.isArray(payload.item) && (payload.source === 'inventory' || payload.source === 'inventory construct') && payload.item.components.length) {
      payload.item = payload.item.components.slice();
    }

    // add all blocks in the payload
    const blocks = Array.isArray(payload.item) ? payload.item : [payload.item];
    // return the list of newly added blocks so we can select them for example
    blocks.forEach(block => {
      const newBlock = (payload.source === 'inventory' || payload.source === 'inventory construct'  || payload.copying)
        ? this.props.blockClone(block)
        : this.props.blocks[block];
      newBlocks.push(newBlock.id);
    });
    // now insert the blocks in one go
    return this.props.blockAddComponents(parent.id, newBlocks, index);
  }

  /**
   * render the component, the scene graph will render later when componentDidUpdate is called
   */
  render() {
    // TODO, can be conditional when master is fixed and this is merged with construct select PR
    // let menu = <ConstructViewerMenu
    //   open={this.props.construct.id === this.props.focus.construct}
    //   constructId={this.props.constructId}
    //   layoutAlgorithm={this.props.layoutAlgorithm}
    //   />;

    const rendered = (
      <div className="construct-viewer" key={this.props.construct.id}>
        {/*menu*/}
        <div className="sceneGraphContainer">
          <div className="sceneGraph"/>
        </div>
        {this.blockContextMenu()}
        {this.constructContextMenu()}
      </div>
    );
    return rendered;
  }
}

function mapStateToProps(state, props) {
  return {
    focus: state.focus,
    construct: state.blocks[props.constructId],
    blocks: state.blocks,
  };
}

export default connect(mapStateToProps, {
  blockCreate,
  blockDelete,
  blockDetach,
  blockClone,
  blockAddComponent,
  blockAddComponents,
  blockRemoveComponent,
  blockGetParents,
  blockSetSbol,
  blockAddSbol,
  blockRename,
  focusBlocks,
  focusBlocksAdd,
  focusBlocksToggle,
  focusConstruct,
  projectGetVersion,
  projectRemoveConstruct,
  inspectorToggleVisibility,
  uiShowDNAImport,
  uiToggleDetailView,
})(ConstructViewer);
