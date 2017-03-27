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

import { projectOpen } from '../../actions/projects';
import { uiShowAuthenticationForm, uiSpin } from '../../actions/ui';
import { userLogin } from '../../actions/user';
import { ERROR_MESSAGE_DEFAULT } from './_validation';

import ModalFooter from '../modal/ModalFooter';
import FormGroup from '../formElements/FormGroup';
import FormText from '../formElements/FormText';
import FormPassword from '../formElements/FormPassword';

export class SignInForm extends Component {
  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiSpin: PropTypes.func.isRequired,
    userLogin: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
  };

  state = {
    email: '',
    password: '',
    submitError: null,
  };

  onEmail = evt => this.setState({ email: evt.target.value });

  onPassword = evt => this.setState({ password: evt.target.value });

  onSubmit = (evt) => {
    evt.preventDefault();

    if (!(this.state.email && this.state.password)) {
      return;
    }

    this.props.uiSpin('Signing in... Please wait.');

    this.props.userLogin(this.state.email, this.state.password)
    .then((user) => {
      this.props.uiSpin();
      this.props.uiShowAuthenticationForm('none');
      this.props.projectOpen(null);
    })
    .catch((reason) => {
      this.props.uiSpin();

      if (reason.message === 'Incorrect username.') {
        this.setState({
          forceDisabled: true,
          submitError: 'Email address not recognized',
        });
      } else {
        this.setState({
          submitError: reason.message || ERROR_MESSAGE_DEFAULT,
        });
      }
    });
  };

  actions = [{
    text: 'Sign In',
    type: 'submit',
    disabled: () => !(this.state.email && this.state.password),
    onClick: this.onSubmit,
  }];

  render() {
    return (
      <form
        id="auth-signin"
        className="Form"
        onSubmit={this.onSubmit}
      >
        <div className="Modal-paddedContent">
          <div className="Modal-banner">
            <span>Don&apos;t have a Genetic Constructor account? </span>
            <a id="auth-showRegister" onClick={() => this.props.uiShowAuthenticationForm('register')}>
              Sign Up - it&apos;s free!
            </a>
          </div>

          <FormGroup label="Email">
            <FormText
              value={this.state.email}
              name="email"
              placeholder="Email Address"
              onChange={this.onEmail}
            />
          </FormGroup>

          <FormGroup label="Password">
            <FormPassword
              value={this.state.password}
              name="password"
              onForgot={() => this.props.uiShowAuthenticationForm('forgot', {})}
              placeholder="Password"
              onChange={this.onPassword}
            />
          </FormGroup>

          {this.state.submitError && (
            <div className="Form-errorMessage">
              {this.state.submitError}
            </div>
          )}

        </div>
        <ModalFooter actions={this.actions} />
      </form>
    );
  }
}

export default connect(null, {
  uiShowAuthenticationForm,
  uiSpin,
  userLogin,
  projectOpen,
})(SignInForm);
