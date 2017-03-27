//accepts a callback: (browser, credentials) => {}
var registerViaHomepage = function (browser, cb) {

  var credentials = {};

  browser
  .url(browser.launchUrl + '/homepage')
  // wait for homepage to be present before starting
  .waitForElementPresent('.LandingPage', 5000, 'Expected landing page to be present')

  // wait for login form to be present
  .waitForElementPresent('#auth-signin', 10000, 'Expected signin form to become visible')
  .waitForElementPresent('button.Modal-action', 5000, 'Modal actions should appear')
  // ensure it is the sign in dialog
  .pause(2000)
  .getText('button.Modal-action', function (result) {
    browser.assert.equal(result.value, "Sign In")
  })
  // click the a tag that switches to registration
  .click('#auth-showRegister')

  // wait for registration dialog to appear
  //.pause(2000)
  .waitForElementPresent('#auth-register', 10000, 'Expected register form to become visible')
  .waitForElementPresent('#auth-register input[name="firstName"]', 1000, 'Expected input name=firstName')
  //wait a second for the form....
  .pause(250)

  //todo - should test and make an error pop up -- need to work around captcha
  /*
   // submit with no values to ensure errors appear
   .submitForm('#auth-register')
   //expect it to complain about there being an error
   .waitForElementPresent('.Form-errorMessage', 5000);
   */

  //use the trick to bypass the captcha
  .setValue('#auth-register input[name="firstName"]', 'darwin magic')
  .pause(250)
  //make sure fields populated
  .assert.value('#auth-register input[name="lastName"]', 'Darwin')
  // get the field values and save for later
  .execute(function () {
    return {
      firstName: document.querySelector('#auth-register input[name="firstName"]').value,
      lastName: document.querySelector('#auth-register input[name="lastName"]').value,
      email: document.querySelector('#auth-register input[name="email"]').value,
      password: document.querySelector('#auth-register input[name="password"]').value,
    };
  }, [], function (result) {
    Object.assign(credentials, result.value);
  })

  // "submit" using click
  .click('.Modal-action')

  //todo - need to work aconut captcha to get submit to work
  //.submitForm('#auth-register')

  //.pause(1000)
  .waitForElementNotPresent('#auth-register', 15000, 'expected form to be dismissed')
  .waitForElementPresent('.userwidget', 10000, 'expected to land on page with the user widget visible')
  //.pause(1000)
  // wait for inventory and inspector to be present to ensure we are on a project page
  .waitForElementPresent('.SidePanel.Inventory', 10000, 'Expected Inventory Groups')
  .waitForElementPresent('.SidePanel.Inspector', 10000, 'Expected Inspector');

  if (cb) {
    browser.execute(() => {}, [], () => cb(browser, credentials));
  }
};

module.exports = registerViaHomepage;
