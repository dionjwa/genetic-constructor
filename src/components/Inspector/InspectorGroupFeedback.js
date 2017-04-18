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
import debounce from 'lodash.debounce';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { reportError } from '../../middleware/reporting';
import { projectGetCurrentId, projectGetVersion } from '../../selectors/projects';
import {
  uiSetGrunt,
  uiClickFeedbackStar,
  uiChangeFeedbackRecommend,
  uiChangeFeedbackText,
  uiChangeFeedbackToIndex,
  uiToggleFeedbackAnon,
} from '../../actions/ui';
import Selector from '../orders/selector';
import { userGetUser } from '../../selectors/user';
import '../../styles/InspectorGroupFeedback.css';

const TO_OPTIONS = [
  'Autodesk GSL: Editor Team',
  'Genetic Constructor Team',
];

/**
 * tracking via heap
 * @param message
 * @param object
 */
const heapTrack = function (message, object) {
  try {
    heap.track(message, object);
  } catch (error) {
    console.warn('Heap Error:', error);
  }
};

class InspectorGroupFeedback extends Component {
  static propTypes = {
    uiSetGrunt: PropTypes.func.isRequired,
    uiClickFeedbackStar: PropTypes.func.isRequired,
    uiChangeFeedbackText: PropTypes.func.isRequired,
    uiChangeFeedbackRecommend: PropTypes.func.isRequired,
    uiChangeFeedbackToIndex: PropTypes.func.isRequired,
    uiToggleFeedbackAnon: PropTypes.func.isRequired,
    userGetUser: PropTypes.func.isRequired,
    projectGetCurrentId: PropTypes.func.isRequired,
    projectGetVersion: PropTypes.func.isRequired,
    text: PropTypes.string.isRequired,
    anon: PropTypes.bool.isRequired,
    toIndex: PropTypes.number.isRequired,
    recommend: PropTypes.number.isRequired,
    stars: PropTypes.number.isRequired,
  };

  constructor() {
    super();
    this.state = {
      mouseStars: 0,
    };
  }

  /**
   * user changed the slider. onInput/onChange are not implemented correctly in most
   * browsers so the timing is unreliable. We use the onInput event but debounce the updating
   * of the value the user selects.
   * @param event
   */
  onRecommendChanged = debounce(() => {
    const sliderRating = parseInt(this.rangeSlider.value, 10);
    this.props.uiChangeFeedbackRecommend(sliderRating);
    this.props.uiSetGrunt('Thanks for your feedback.');
    heapTrack('Slider rating', { sliderRating });
  }, 500, { leading: false, trailing: true });

  /**
   * toggle anon mode
   */
  onAnonChanged = () => {
    this.props.uiToggleFeedbackAnon();
  };

  onTextChanged = (e) => {
    this.props.uiChangeFeedbackText(e.target.value);
  };

  /**
   * user wants to publish feedback
   */
  onPublishFeedback = () => {
    const team = TO_OPTIONS[this.props.toIndex];
    const anonymous = this.props.anon;
    const message = this.props.text;

    const url = window.location.href;
    const user = this.props.userGetUser();
    const projectId = this.props.projectGetCurrentId();
    const projectVersion = this.props.projectGetVersion(projectId);
    const userId = (user && !anonymous) ? user.userid : null;

    if (message) {
      this.props.uiSetGrunt('Thanks for your feedback.');
      heapTrack('Feedback', {
        team,
        anonymous,
        message,
      });
      reportError(team, message, url, { team, userId, projectId, projectVersion })
        .then((json) => {
          this.props.uiSetGrunt('Thanks for your feedback.');
        })
        .catch((resp) => {
          this.props.uiSetGrunt('There was a problem sending your feedback. Please try again.');
        });
    } else {
      this.props.uiSetGrunt('Please enter some feedback first.');
    }
  };

  /**
   * user clicked a star rating
   * @param index 0..4
   */
  clickStar(starIndex) {
    this.props.uiClickFeedbackStar(starIndex);
    this.props.uiSetGrunt('Thanks for your feedback.');
    heapTrack('Star Rating', { value: starIndex + 1 });
  }

  /**
   * mouse over a star
   * @param index
   */
  overStar = (starIndex) => {
    this.setState({ mouseStars: starIndex + 1 });
  };

  /**
   * when the destination for feedback is changed
   * @param val
   */
  toIndexChanged = (val) => {
    this.props.uiChangeFeedbackToIndex(TO_OPTIONS.indexOf(val));
  };

  render() {
    const stars = Math.max(this.state.mouseStars, this.props.stars);

    return (<div className="InspectorGroupFeedback">
      <span className="bold">How would you rate this software right now?</span>
      <div className="star-box">
        <div
          className={`star-five star-five-small star-0 ${stars > 0 ? '' : 'star-gray'}`}
          onClick={() => this.clickStar(0)}
          onMouseEnter={() => this.overStar(0)}
          onMouseLeave={() => this.overStar(-1)}
        />
        <div
          className={`star-five star-five-small star-1 ${stars > 1 ? '' : 'star-gray'}`}
          onClick={() => this.clickStar(1)}
          onMouseEnter={() => this.overStar(1)}
          onMouseLeave={() => this.overStar(-1)}
        />
        <div
          className={`star-five star-five-small star-2 ${stars > 2 ? '' : 'star-gray'}`}
          onClick={() => this.clickStar(2)}
          onMouseEnter={() => this.overStar(2)}
          onMouseLeave={() => this.overStar(-1)}
        />
        <div
          className={`star-five star-five-small star-3 ${stars > 3 ? '' : 'star-gray'}`}
          onClick={() => this.clickStar(3)}
          onMouseEnter={() => this.overStar(3)}
          onMouseLeave={() => this.overStar(-1)}
        />
        <div
          className={`star-five star-five-small star-4 ${stars > 4 ? '' : 'star-gray'}`}
          onClick={() => this.clickStar(4)}
          onMouseEnter={() => this.overStar(4)}
          onMouseLeave={() => this.overStar(-1)}
        />
      </div>
      <hr />
      <span className="bold">I would recommend this software to others.</span>
      <input
        type="range"
        min="0"
        max="4"
        step="1"
        defaultValue={this.props.recommend}
        onInput={this.onRecommendChanged}
        ref={(el) => { this.rangeSlider = el; }}
      />
      <div className="range-labels">
        <span className="light">Strongly disagree</span>
        <span className="light" style={{ float: 'right' }}>Strongly agree</span>
      </div>
      <hr />
      <span className="bold">Tell us what you think</span>
      <br />
      <br />
      <span className="light">To</span>
      <Selector
        options={TO_OPTIONS}
        onChange={this.toIndexChanged}
        disabled={false}
        value={TO_OPTIONS[this.props.toIndex]}
      />
      <br />
      <textarea
        placeholder="Enter your feedback here"
        rows="20"
        onChange={this.onTextChanged}
        value={this.props.text}
      />
      <br />
      <span className="light">Feedback is published on Github</span>
      <br />
      <br />
      <input type="checkbox" checked={this.props.anon} onChange={this.onAnonChanged} />
      <span className="light checkbox-label">Publish Anonymously</span>
      <button className="publish-button" onClick={this.onPublishFeedback}>Publish</button>
      <hr />
      <span className="bold">Share Genetic Constructor</span>
      <div className="socialist">
        <a href="https://www.facebook.com/sharer/sharer.php?u=www.geneticconstructor.com" target="_blank" rel="noopener noreferrer">
          <img className="social-button" src="/images/ui/social-facebook.svg" />
        </a>
        <a href="https://twitter.com/home?status=www.geneticconstructor.com" target="_blank" rel="noopener noreferrer">
          <img className="social-button" src="/images/ui/social-twitter.svg" />
        </a>
        <a href="https://www.linkedin.com/shareArticle?mini=true&url=www.geneticconstructor.com&title=Autodesk%20-%20Genetic%20Constructor&summary=DNA%20Design%20Tools%20from%20Autodesk&source=www.geneticconstructor.com" target="_blank" rel="noopener noreferrer">
          <img className="social-button" src="/images/ui/social-linkedin.svg" />
        </a>
        <a href="https://plus.google.com/share?url=www.geneticconstructor.com" target="_blank" rel="noopener noreferrer">
          <img className="social-button" src="/images/ui/social-google+.svg" />
        </a>
        <a href="mailto:?&subject=Autodesk - Genetic Constructor&body=Check%20out%20Autodesk%20Genetic%20Constructor%3A%20http%3A//geneticconstructor.com">
          <img className="social-button" src="/images/ui/social-email.svg" />
        </a>
      </div>

    </div>);
  }
}

export default connect(
  state => state.ui.feedback,
  {
    uiClickFeedbackStar,
    uiChangeFeedbackRecommend,
    uiChangeFeedbackText,
    uiChangeFeedbackToIndex,
    uiSetGrunt,
    uiToggleFeedbackAnon,
    userGetUser,
    projectGetCurrentId,
    projectGetVersion,
  },
)(InspectorGroupFeedback);
