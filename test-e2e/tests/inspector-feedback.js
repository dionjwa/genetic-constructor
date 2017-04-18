var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInspectorPanel = require('../fixtures/open-inspector-panel');
var clickAt = require('../fixtures/clickAt');

const FEEDBACK_TEXT = 'Donald Trump is Awesome!';

module.exports = {
  'Test feedback panel in inspector' : function (browser) {
    size(browser);
    homepageRegister(browser);
    openInspectorPanel(browser, 'Feedback');

    browser
      .waitForElementNotPresent('.ribbongrunt-visible')
      .assert.countelements('.InspectorGroupFeedback .star-five', 5)

      .assert.countelements('.InspectorGroupFeedback .star-gray', 5)

      .click('.InspectorGroupFeedback .star-0')
      .pause(1000)
      .assert.countelements('.InspectorGroupFeedback .star-gray', 4)

      .click('.InspectorGroupFeedback .star-1')
      .pause(1000)
      .assert.countelements('.InspectorGroupFeedback .star-gray', 3)

      .click('.InspectorGroupFeedback .star-2')
      .pause(1000)
      .assert.countelements('.InspectorGroupFeedback .star-gray', 2)

      .click('.InspectorGroupFeedback .star-3')
      .pause(1000)
      .assert.countelements('.InspectorGroupFeedback .star-gray', 1)

      .click('.InspectorGroupFeedback .star-4')
      .pause(1000)
      .assert.countelements('.InspectorGroupFeedback .star-gray', 0)

      .waitForElementNotPresent('.ribbongrunt-visible');
      clickAt(browser, '.InspectorGroupFeedback input[type="range"]', 2, 2)
      browser
        .waitForElementPresent('.ribbongrunt-visible')

        .waitForElementNotPresent('.ribbongrunt-visible')
        .setValue('.InspectorGroupFeedback textarea', FEEDBACK_TEXT)
        .pause(1000) // Pause allows save to happen with throttling
        .click('.InspectorGroupFeedback .publish-button')
        .waitForElementPresent('.ribbongrunt-visible')

        // Make sure state persists between inspector tabs
        .click('div[data-section=History]')
        .waitForElementNotPresent('.InspectorGroupFeedback')
        .click('div[data-section=Feedback]')
        .waitForElementPresent('.InspectorGroupFeedback')
        .assert.countelements('.InspectorGroupFeedback .star-gray', 0)
        .assert.containsText('.InspectorGroupFeedback textarea', FEEDBACK_TEXT, 'Text properly preserved')
        .end();
  }
};
