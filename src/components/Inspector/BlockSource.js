import React, { PropTypes } from 'react';
import { registry } from '../../inventory/registry';

import '../../styles/BlockSource.css';

export default function BlockSource({ block, ...rest }) {
  const { source } = block;
  const sourceKey = source.source;

  if (!sourceKey) {
    return (<span>Unknown Source</span>);
  }

  const registrySource = registry[sourceKey];

  //if the source is not registered with the running app... just show static text
  if (!registrySource) {
    return (<span>{sourceKey}</span>);
  }

  const name = registrySource.name;
  const url = (typeof registrySource.sourceUrl === 'function') ?
    registrySource.sourceUrl(source)
    : null;

  //note - use key to force re=render when href is removed. React v15 uses removeAttribute and will handle this, can remove when upgrade.
  return (<a className="BlockSource"
             href={url}
             key={url ? 'y' : 'n'}
             target="_blank" {...rest}>
    <span className="BlockSource-name">{name}</span>
    {url && (<span className="BlockSource-icon"/>)}
  </a>);
}

BlockSource.propTypes = {
  block: PropTypes.shape({
    source: PropTypes.object.isRequired,
  }).isRequired,
};
