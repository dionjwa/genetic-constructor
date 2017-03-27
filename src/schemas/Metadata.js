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
import Schema from './SchemaClass';
import fields from './fields/index';

/**
 * Metadata is a subfield of Instances
 * @name MetadataSchema
 * @memberOf module:Schemas
 * @gc Schema
 */
const fieldDefs = {
  name: [
    fields.string({ max: 256 }),
    'Name of the instance',
  ],
  description: [
    fields.string({ max: 2048 }),
    'Description of instance',
  ],
  created: [
    fields.number(),
    'POSIX time when object was created',
    { scaffold: () => Date.now() },
  ],
  updated: [
    fields.number(),
    'POSIX time when object was updated',
    { avoidScaffold: true },
  ],
  tags: [
    fields.object().required,
    'Dictionary of tags defining object',
  ],
  keywords: [
    fields.arrayOf((value => typeof value === 'string')).required,
    'Keywords (lowercase)',
  ],
  palette: [
    fields.string(),
    'Color palette (for Project or Construct)',
    { avoidScaffold: true },
  ],
};

export class MetadataSchemaClass extends Schema {
  constructor(fieldDefinitions) {
    super(Object.assign({}, fieldDefs, fieldDefinitions));
  }
}

export default new MetadataSchemaClass();
