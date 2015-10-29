import mapValues from '../utils/mapValues';

/**
 * @class SchemaDefinition
 * @param fieldDefinitions {Object} dictionary of field names to definitions. Definitions take the form:
 * [
 *   parameterizedFieldType {function} Parameterized field type (e.g. fields.id().required)
 *   description {string} description of the field in this schema
 *   additional {Object} object to assign to the field
 * ]
 * @returns {SchemaDefinition} SchemaDefinition instance, which can validate(), describe(), etc.
 * @example
 * import fields from './fields';
 *
 * let SimpleDefinition = new SchemaDefinition({
 *   id : [
 *     fields.id().required,
 *     'the ID for the Simple Instance',
 *     {additionalField : 'yada'}
 *   ]
 * }
 */
export default class SchemaDefinition {
  constructor (fieldDefinitions) {
    this.definitions = fieldDefinitions;
    this.fields      = createFields(fieldDefinitions);
  }

  extend (childDefinitions) {
    return new SchemaDefinition(Object.assign({},
      this.definitions,
      childDefinitions
    ));
  }

  validate (schema = {}) {
    return Object.keys(this.fields).every(fieldName => {
      let schemaValue = schema[fieldName],
          field       = this.fields[fieldName],
          //need to bind field in case it's a schema
          validator   = field.validate.bind(field),
          //note - should not error using our validators. Might want to try-catch though, e.g. if we allow custom validator functions
          isValid     = validator(schemaValue);

      return isValid;
    });
  }

  describe () {
    return mapValues(this.fields, field => (
      field.description ||
      field.typeDescription ||
      '<no description>'
    ));
  }
}

function createFields (fieldDefinitions) {
  return mapValues(fieldDefinitions,
    (fieldDefinition, fieldName) => {

      //note - assign to field to maintain prototype, i.e. validate() function if instanceof SchemaDefinition
      return Object.assign(
        createSchemaField(...fieldDefinition),
        {name: fieldName}
      );
    }
  );
}

function createSchemaField (field, description = '', additional) {

  //in case still here, created by createFieldType()
  delete field.required;

  //note - assign to field to maintain prototype, e.g. validate() function if instanceof SchemaDefinition
  return Object.assign(field,
    {description},
    additional
  );
}