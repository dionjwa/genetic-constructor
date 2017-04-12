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
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import { commonsPublish } from '../../actions/commons';
import { uiSetGrunt, uiShowPublishDialog } from '../../actions/ui';
import {
  projectRename,
  projectSetDescription,
  projectSetKeywords,
  projectSave,
} from '../../actions/projects';
import ModalFooter from './ModalFooter';
import FormGroup from '../formElements/FormGroup';
import FormText from '../formElements/FormText';
import FormKeywords from '../formElements/FormKeywords';
import { SHARING_CREATIVE_COMMONS_CC0, SHARING_IN_PUBLIC_INVENTORY } from '../../constants/links';

import '../../styles/PublishModal.css';

class PublishForm extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    projectVersion: PropTypes.number,
    project: PropTypes.object.isRequired,
    initialMessage: PropTypes.string.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    uiShowPublishDialog: PropTypes.func.isRequired,
    commonsPublish: PropTypes.func.isRequired,
    projectSave: PropTypes.func.isRequired,
    projectRename: PropTypes.func.isRequired,
    projectSetDescription: PropTypes.func.isRequired,
    projectSetKeywords: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      dirty: false,
      versionNote: props.initialMessage,
      name: props.project.metadata.name,
      description: props.project.metadata.description,
      keywords: props.project.metadata.keywords,
    };
  }

  onSubmit = (evt) => {
    const { projectId, projectVersion, project, projectRename, projectSetDescription, projectSetKeywords, projectSave, commonsPublish, uiSetGrunt, uiShowPublishDialog } = this.props;
    const { name, description, keywords, versionNote } = this.state;

    evt.preventDefault();

    if (!this.formValid()) {
      return;
    }

    //if we have a project version, dont allow changing the name etc. that actually update the project
    const onlyUpdating = this.onlyUpdating();

    //if we got a version, we are updating. Don't update the project, just the snapshot
    let savePromise = Promise.resolve(projectVersion);

    //if no version, update project based on form and then save, returning the version
    if (!onlyUpdating) {
      if (name !== project.metadata.name) {
        projectRename(projectId, name);
      }
      if (description !== project.metadata.description) {
        projectSetDescription(projectId, description);
      }
      if (!_.isEqual(keywords, project.metadata.keywords)) {
        projectSetKeywords(projectId, keywords);
      }

      savePromise = projectSave(projectId)
      .then(version =>
        //return null when save was not necessary
        Number.isInteger(version) ? version : project.version);
    }

    savePromise
    .then(version => commonsPublish(projectId, version, {
      message: versionNote,
      keywords,
    }))
    .then(() => {
      uiShowPublishDialog(false);
      uiSetGrunt(`Your project has been ${onlyUpdating ? 'updated' : ' published'}`);
    });
  };

  //if we have a project version, dont allow changing the name etc. that actually update the project
  onlyUpdating() {
    return Number.isInteger(this.props.projectVersion);
  }

  formValid() {
    const { name, description, keywords, dirty } = this.state;

    const onlyUpdating = this.onlyUpdating();
    const hasFields = !!name && !!description && keywords.length > 0;

    return hasFields && (!onlyUpdating || dirty);
  }

  render() {
    const { name, description, keywords, versionNote } = this.state;

    const onlyUpdating = this.onlyUpdating();

    const actions = [{
      text: onlyUpdating ? 'Update' : 'Publish',
      onClick: this.onSubmit,
      disabled: () => !this.formValid(),
    }];

    const bannerText = onlyUpdating ?
      'Update information about your project in the Commons' :
      'Share a version of your project in the Genetic Constructor Public Inventory.';

    return (
      <form
        id="publish-modal"
        className="Form PublishModal"
        onSubmit={this.onSubmit}
      >
        <div className="Modal-paddedContent">
          <div className="Modal-banner">
            <span>{bannerText}&nbsp;
              <a
                href={SHARING_IN_PUBLIC_INVENTORY}
                target="_blank"
                rel="noopener noreferrer"
              >Learn more...</a>
            </span>
          </div>

          <FormGroup label="Project Title*">
            <FormText
              value={name}
              disabled={onlyUpdating}
              name="name"
              placeholder="Title of your project"
              onChange={evt => this.setState({ dirty: true, name: evt.target.value })}
            />
          </FormGroup>

          <FormGroup label="Project Description*" labelTop>
            <FormText
              useTextarea
              value={description}
              disabled={onlyUpdating}
              name="description"
              placeholder="Decription of your project"
              onChange={evt => this.setState({ dirty: true, description: evt.target.value })}
            />
          </FormGroup>

          <FormGroup label="Keywords*">
            <FormKeywords
              keywords={keywords}
              onChange={keywords => this.setState({ dirty: true, keywords })}
            />
          </FormGroup>

          <FormGroup label="Version Note" labelTop>
            <FormText
              useTextarea
              value={versionNote}
              name="keywords"
              placeholder="Provide information about this version (optional)"
              onChange={evt => this.setState({ dirty: true, versionNote: evt.target.value })}
            />
          </FormGroup>

          <FormGroup label="License" labelTop>
            <div style={{ width: '350px' }}>
              <p>By selecting &apos;Publish&apos; below, you agree that your project will become available
                license-free in the public domain under the
                <a href={SHARING_CREATIVE_COMMONS_CC0} target="_blank" rel="noopener noreferrer">Create Commons CCØ</a>&nbsp;
                license. <a href={SHARING_IN_PUBLIC_INVENTORY} target="_blank" rel="noopener noreferrer">Learn more...</a>
              </p>
              <br />
              <p><a href="mailto:geneticconstructor@autodesk.com">Contact us</a> if your project requires a more
                restrictive license.</p>
            </div>
          </FormGroup>

        </div>
        <ModalFooter actions={actions} />
      </form>
    );
  }
}

export default connect((state, props) => {
  const gotVersion = Number.isInteger(state.ui.modals.publishDialogVersion);
  const foundSnapshot = gotVersion ?
    _.find(state.snapshots, { projectId: props.projectId, version: state.ui.modals.publishDialogVersion }) :
    null;
  const initialMessage = foundSnapshot ? foundSnapshot.message : '';

  return {
    project: state.projects[props.projectId],
    projectVersion: state.ui.modals.publishDialogVersion,
    initialMessage,
  };
}, {
  projectRename,
  projectSetDescription,
  projectSetKeywords,
  projectSave,
  commonsPublish,
  uiSetGrunt,
  uiShowPublishDialog,
})(PublishForm);
