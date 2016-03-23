import invariant from 'invariant';
import Block from '../../models/Block';
import merge from 'lodash.merge';

function normalizePartType(inputType) {
  let partType = inputType.toLowerCase();
  if (partType === 'orf') {
    partType = 'cds';
  }

  return partType;
}

function parseBasicFields(result) {
  const { name, part_type } = result;
  const partType = normalizePartType(part_type);

  return {
    metadata: {
      name: name,
    },
    rules: {
      sbol: partType,
    },
    source: {
      source: 'igem',
      id: name,
    },
  };
}

//sync
export function parseSearchResult(result) {
  return new Block(parseBasicFields(result));
}

//async
export function parseFullResult(result) {
  const { sequence } = result;
  const basics = parseBasicFields(result);
  const additional = {
    metadata: {
      description: result.metadata.part_short_desc,
      author: result.metadata.part_author,
      created: result.metadata.part_entered,
    },
    sequence: {
      annotations: result.metadata.features.feature.map(feature => ({
        isForward: feature.direction === 'forward',
        start: parseInt(feature.startpos, 10),
        end: parseInt(feature.endpos, 10),
        name: feature.title || '',
        type: feature.type || '',
      })),
    },
    source: {
      url: result.metadata.part_url,
    },
  };
  const block = new Block(merge(basics, additional));
  return block.setSequence(sequence);
}

export function parseResults(results) {
  invariant(Array.isArray(results), 'results must be an array');

  return results.map(parseSearchResult);
}

export default parseResults;