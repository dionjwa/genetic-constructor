import uuid from 'node-uuid';
import sha1 from 'sha1';
import merge from 'lodash.merge';

/*
 * Note that there are scaffolding functions available on each schema.
 * These models are intentionally to note when changes to the schema occurs - see rest of /test/schemas
 */

export const Block = {
  id: uuid.v4(),
  parents: [],
  metadata: {
    authors: [],
    tags: {},
  },
  sequence: {
    annotations: [],
  },
  source: {},
  options: [],
  components: [],
  rules: {},
  notes: {},
};

export const Project = {
  id: uuid.v4(),
  version: sha1('project!'),
  parents: [],
  metadata: {
    authors: [],
    tags: {},
  },
  components: [],
  settings: {},
};

export const Annotation = {
  id: uuid.v4(),
  description: 'example annotation',
  tags: {},
  optimizability: 'none',
  sequence: 'acgtagc',
};

export const makeParent = () => ({
  id: uuid.v4(),
  sha: sha1('' + Math.floor(Math.random() * 10000000)),
});

export const blockWithParents = merge(Block, {
  parents: [makeParent(), makeParent()],
});
