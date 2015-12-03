import React, { PropTypes } from 'react';
import Glyph2D from '../glyph2d';

export default class Ellipse2D extends Glyph2D {

  static propTypes = {
    w: PropTypes.number.isRequired,
    h: PropTypes.number.isRequired,
    fill: PropTypes.string.isRequired,
    stroke: PropTypes.string,
    strokeWidth: PropTypes.number,
  }
  /**
   * base class for all glyphs
   * @param {Node2D} node - the node for which we render ourselves
   */
  constructor(node) {
    super(node);
  }

  render() {
    const w2 = this.props.w / 2;
    const h2 = this.props.h / 2;

    return (
      <svg width={this.props.w + 'px'} height={this.props.h + 'px'}>
        <ellipse fill={this.props.fill} cx={w2} cy={h2} rx={w2} ry={h2} />
      </svg>
    );
  }
}