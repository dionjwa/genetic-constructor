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
import invariant from 'invariant';
import { assign, isEqual, merge } from 'lodash';

import { projectFileRead, projectFileWrite } from '../middleware/projectFiles';
import ProjectSchema from '../schemas/Project';
import safeValidate from '../schemas/fields/safeValidate';
import { id } from '../schemas/fields/validators';
import { palettes } from '../utils/color/index';
import Instance from './Instance';

const idValidator = (input, required = false) => safeValidate(id(), required, input);

/**
 * Projects are the containers for a body of work, including all their blocks, preferences, orders, and files.
 * Projects are versioned using git, and save their most recent SHA in project.version
 * @name Project
 * @class
 * @extends Instance
 * @gc Model
 */
export default class Project extends Instance {
  /**
   * Create a project given some input object
   * @memberOf Project
   * @param {Object} [input]
   * @param {Boolean} [immutable=true]
   * @returns {Project}
   */
  constructor(input, immutable = true) {
    super(input, ProjectSchema.scaffold(), immutable);
  }

  /**
   * Create an unimmutable project, extending input with schema
   * @method classless
   * @memberOf Project
   * @param {Object} [input]
   * @returns {Object} an unimmutable JSON, no instance methods
   */
  static classless(input) {
    return assign({}, new Project(input, false));
  }

  /**
   * Validate a Project data object
   * @method validate
   * @memberOf Project
   * @static
   * @param {Object} input
   * @param {boolean} [throwOnError=false] Whether to throw on errors
   * @throws if `throwOnError===true`, will throw when invalid
   * @returns {boolean} if `throwOnError===false`, whether input is a valid block
   * @example
   * Project.validate(new Block()); //false
   * Project.validate(new Project()); //true
   */
  static validate(input, throwOnError) {
    return ProjectSchema.validate(input, throwOnError);
  }

  /**
   * compares two projects, checking if they are the same (ignoring project version + save time)
   * use newer one as second arg (in case first one doesnt have updated / version stamp)
   * @method compare
   * @memberOf Project
   * @static
   * @param {Object} one
   * @param {Object} two
   * @param {boolean} [throwOnError=false] Whether to throw on errors
   * @throws if `throwOnError===true`, will throw when not equal
   * @returns {boolean} whether equal
   */
  static compare(one, two, throwOnError = false) {
    if ((typeof one === 'object') && (typeof two === 'object') && (one === two)) {
      return true;
    }

    try {
      invariant(one && two, 'must pass two projects');
      invariant(one.id === two.id, 'projects IDs do not match');
      invariant(isEqual(one.components, two.components), 'project components do not match');

      //expensive check across whole project
      //want to ignore the version and updated, since may be set between saves, without changing the data
      //lodash doesnt give a nice way to omit certain properties when cloning...
      //also, need to onvert to POJO in case one is a model and one an object
      const cloned = (inst) => {
        //merge onto {} to remove prototype
        const clone = merge({}, inst);
        delete clone.version;
        delete clone.metadata.updated;
        return clone;
      };

      invariant(isEqual(cloned(one), cloned(two)), 'projects contain different data');
    } catch (err) {
      if (throwOnError === true) {
        throw err;
      }
      return false;
    }

    return true;
  }

  /**
   * Clone a project, adding parent to the ancestry.
   * Calls {@link Instance.clone} internally
   * Cloning a project will disable the frozen rule, unless you pass in overwrite
   * note that this does not handle cloning the blocks, and updating component IDs
   * @method clone
   * @memberOf Project
   * @param {object|null} [parentInfo={}] Parent info for denoting ancestry. Required parent info is already available on the project, but can pass additional fields or overrides. If pass null to parentInfo, the Project is cloned without adding anything to the history, and it is unfrozen (and keeps the same ID).
   * @param {object} overwrites Overwrites to make to the cloned Project, e.g. { owner: userId }
   * @returns {Project} Cloned Project
   */
  clone(parentInfo = {}, overwrites = {}) {
    const mergeWith = merge({}, overwrites);

    //unfreeze a clone by default if it is frozen, but allow overwriting if really want to
    //don't want to add the field if unnecessary, otherwise could add to mergeWith scaffold
    if (this.rules.frozen === true && (!mergeWith.rules || mergeWith.rules.frozen !== true)) {
      merge(mergeWith, { rules: { frozen: false } });
    }

    return super.clone(parentInfo, mergeWith);
  }

  /**
   * Mutate a property of a Project to a new value. calls {@link Instance.mutate}.
   * @method mutate
   * @memberOf Project
   * @param {string} path Path of property to change
   * @param {*} value New value
   * @throws if the Project is frozen
   * @returns {Project} The mutated Project
   * @example
   * const initial = new Project({myArray: [0,0]});
   * const next = initial.mutate('myArray[1]', 10);
   * initial.myArray[1]; //0
   * next.myArray[1]; //10
   */
  mutate(path, value) {
    invariant(!this.isFrozen(), 'cannot mutate a frozen Project');
    return super.mutate(path, value);
  }

  /**
   * Return a new Project with input object merged into it. Calls {@link Instance.merge}
   * @method merge
   * @memberOf Project
   * @param {Object} obj Object to merge into instance
   * @throws if the Project is frozen
   * @returns {Project} A new Project, with `obj` merged in
   * @example
   * const initial = new Project({myArray: [0,0]});
   * const next = initial.merge({some: 'value', myArray: false});
   * initial.myArray; //[0,1]
   * next.myArray; //false
   * initial.some; //undefined
   * next.some; //'value'
   */
  merge(obj) {
    invariant(!this.isFrozen(), 'cannot mutate a frozen Project');
    return super.merge(obj);
  }

  /**
   * Set name of the project
   * @method setName
   * @memberOf Project
   * @param {string} name
   * @throws if not a string
   * @returns {Project}
   */
  setName(name) {
    invariant(typeof name === 'string', 'must pass name string');
    return this.mutate('metadata.name', name);
  }

  /**
   * Get name of Project
   * @method getName
   * @memberOf Project
   * @returns {string}
   */
  getName() {
    return this.metadata.name || 'Untitled Project';
  }

  /**
   * Set a Projects's color palette.
   * @method setPalette
   * @memberOf Project
   * @param {string} [palette] Palette name
   * @returns {Project}
   * @example
   * new Project().setPalette('bright');
   */
  setPalette(palette) {
    invariant(palettes.indexOf(palette) >= 0, 'palette must exist');
    return this.mutate('metadata.palette', palette);
  }

  /**
   * Check if the project is frozen
   * @method isFrozen
   * @memberOf Project
   * @returns {boolean} Whether project is frozen
   */
  isFrozen() {
    return this.rules.frozen === true;
  }

  //ideally, this would just return the same instance, would be much easier
  /**
   * Update the version of the project. Returns a new Instance, so use {@link Project.compare} to check if two projects are the same and ignore the version
   * @method updateVersion
   * @memberOf Project
   * @param {string} version Must be a valid SHA
   * @param {number} [updated=Date.now()] POSIX time
   * @returns {Project}
   */
  updateVersion(version, updated = Date.now()) {
    invariant(Number.isInteger(version), 'must pass valid version to update version');
    invariant(Number.isInteger(updated), 'must pass valid time to update version');
    return this.merge({ version, metadata: { updated } });
  }

  /**
   * Add constructs to the Project
   * @method addComponents
   * @memberOf Project
   * @param {...UUID} components IDs of components
   * @returns {Project}
   */
  addComponents(...components) {
    invariant(components.length && components.every(comp => idValidator(comp)), 'must pass component IDs');
    return this.mutate('components', components.concat(this.components));
  }

  /**
   * Add constructs to the Project at the given index
   * @method addComponents
   * @memberOf Project
   * @param {number} index - index to insert components at
   * @param {...UUID} components IDs of components
   * @returns {Project}
   */
  addComponentsAt(index, ...components) {
    invariant(components.length && components.every(comp => idValidator(comp)), 'must pass component IDs');
    invariant(index <= this.components.length && index >= 0, 'index out of bounds');
    return this.mutate('components', this.components.slice(0, index).concat(components).concat(this.components.slice(index)));
  }

  /**
   * Remove constructs from the project
   * @method removeComponents
   * @memberOf Project
   * @param {...UUID} components IDs of components
   * @returns {Project}
   */
  removeComponents(...components) {
    return this.mutate('components', [...new Set(this.components.filter(comp => components.indexOf(comp) < 0))]);
  }

  /**
   * Add / update a Project File
   * @param {String} namespace
   * @param {String} name Name of file
   * @param {String} contents
   * @return {Promise}
   * @resolve {Project} Updated project
   * @reject {Error}
   */
  fileWrite(namespace, name, contents) {
    return projectFileWrite(this.id, namespace, name, contents)
    .then((result) => {
      const version = result.VersionId;
      const fileIndex = this.files.findIndex(fileObj => fileObj.namespace === namespace && fileObj.name === name);

      const fileInfo = {
        name,
        namespace,
        version,
      };

      //update version
      if (fileIndex >= 0) {
        return this.mutate(`files[${fileIndex}]`, fileInfo);
      }
      return this.mutate('files', [...this.files, fileInfo]);
    });
  }

  /**
   * Retrieve a project file
   * @param {String} namespace
   * @param {String} name Name of file
   * @param {String} [format='text'] Options are 'text', 'buffer', 'json'... default is text, but all other values will simply return fetch response without any parsing
   * @param {String} [version] [not yet supported]
   * @returns {Promise}
   * @resolve {string} File contents, as string
   * @reject error
   */
  fileRead(namespace, name, format = 'text', version) {
    return projectFileRead(this.id, namespace, name)
    .then((resp) => {
      if (format === 'text') {
        return resp.text();
      } else if (format === 'json') {
        return resp.json();
      }
      return resp;
    });
  }
}
