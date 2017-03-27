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

import { projectOpen } from '../actions/projects';
import { uiSetGrunt, uiShowAuthenticationForm, uiShowUserWidget } from '../actions/ui';
import '../styles/homepage.css';
import { getLocal, setLocal } from '../utils/localstorage';
import { PRIVACY_POLICY } from '../constants/links';

export class HomePage extends Component {
  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiShowUserWidget: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    location: PropTypes.shape({
      query: PropTypes.object,
    }).isRequired,
    params: PropTypes.shape({
      comp: PropTypes.oneOf(['signin', 'register', 'account', 'reset', 'forgot']),
    }).isRequired,
    user: PropTypes.object,
  };

  // truthy if the cookie warning must be shown
  static showCookieWarning() {
    return !getLocal('cookie-warning', false);
  }

  static isIE() {
    const ua = window.navigator.userAgent;
    const msie = ua.indexOf('MSIE ');
    return msie > 0 || !!navigator.userAgent.match(/Trident.*rv:11\./);
  }

  state = {
    showCookieWarning: HomePage.showCookieWarning(),
  };

  // this route can result from path like 'homepage/signin', 'homepage', 'homepage/register' etc.
  // If the final path is the name of an authorization form we will show it
  componentDidMount() {
    const authForm = this.props.params.comp;
    if (authForm) {
      this.props.uiShowAuthenticationForm(authForm);
    } else if (this.props.user && this.props.user.userid && (this.props.location.query && !this.props.location.query.noredirect)) {
      // if not showing an auth form goto most recent project or demo project
      // NOTE: the nodirect query string prevents redirection

      // revisit last project
      this.props.projectOpen(null, true);
      return;
    }

    // user widget is hidden on homepage
    this.props.uiShowUserWidget(false);
  }

  /**
   * the homepage is the only page that doesn't show the user widget, so we can
   * display whenever we leave
   */
  componentWillUnmount() {
    this.props.uiShowUserWidget(true);
  }

  signIn = (evt) => {
    evt.preventDefault();
    if (HomePage.isIE()) {
      this.props.uiSetGrunt('Sorry we do not currently support Internet Explorer. We recommend the Chrome browser from Google.');
      return;
    }
    this.props.uiShowAuthenticationForm('signin');
  };

  /**
   * used is closing the cookie warnig so update local storage as seen
   */
  cookieWarningClosed = () => {
    setLocal('cookie-warning', 'acknowledged');
    this.setState({
      showCookieWarning: false,
    });
  };

  render() {
    const warning = this.state.showCookieWarning ? (
      <div className="homepage-cookie-warning">
        Genetic Constructor uses cookies to ensure you get the best experience.
        <a href={PRIVACY_POLICY} target="_blank" rel="noopener noreferrer">More Information</a>
        <div onClick={this.cookieWarningClosed} className="homepage-cookie-close">
          Close
        </div>
      </div>
      ) : null;

    return (
      <div className="homepage">
        <div className="homepage-image-area">
          <img className="homepage-logo" src="/images/homepage/app-logo.png" role="presentation" />
          {warning}
          <img className="homepage-background" src="/images/homepage/tiles.jpg" role="presentation" />
          <div className="homepage-name">
            <div className="lighter">Autodesk&nbsp;</div>
            <div>Genetic Constructor</div>
          </div>
          <div className="homepage-title">
            <div>Design and manufacture<br />living things</div>
          </div>
          <div className="homepage-getstarted" onClick={this.signIn}>Get started</div>
        </div>
        <img className="homepage-autodesk" role="presentation" src="/images/homepage/autodesk-logo.png" />
        <img className="homepage-egf" role="presentation" src="/images/homepage/egf-logo.png" />
        <div className="homepage-footer">
          <div className="homepage-footer-title">New in version 0.1:</div>
          <div className="homepage-footer-list">
            <ul>
              <li><span>&bull;</span>Search and import parts directly from the IGEM and NCBI databases.</li>
              <li><span>&bull;</span>Specify parts from the Edinburgh Genome Foundry inventory.</li>
              <li><span>&bull;</span>Import and export GenBank and FASTA files.</li>
              <li><span>&bull;</span>Create an inventory of your own projects, constructs and parts to reuse.</li>
              <li><span>&bull;</span>Drag and drop editing.</li>
            </ul>
            <ul>
              <li><span>&bull;</span>Inspect sequence detail.</li>
              <li><span>&bull;</span>Create nested constructs to manage complexity.</li>
              <li><span>&bull;</span>Assign SBOL visual symbols and colors.</li>
              <li><span>&bull;</span>Add titles and descriptions blocks, constructs and projects.</li>
              <li><span>&bull;</span>Organize constructs into separate projects.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.user,
  };
}

export default connect(mapStateToProps, {
  uiShowAuthenticationForm,
  uiShowUserWidget,
  uiSetGrunt,
  projectOpen,
})(HomePage);
