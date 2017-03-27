var homepageRegister = require('../fixtures/homepage-register');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var clickConstructTitle = require('../fixtures/click-construct-title');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var openInspectorPanel = require('../fixtures/open-inspector-panel');
var size = require('../fixtures/size');

module.exports = {
  'Test that when creating a new project we get a new focused construct' : function (browser) {

    size(browser);

    // register via fixture
    homepageRegister(browser);

    // now we can go to the project page
    browser
      // wait for inventory and inspector to be present
      .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups')
      .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector')

    // start with a fresh project
    newProject(browser);
    openInventoryPanel(browser, 'Sketch');
    openInspectorPanel(browser, 'Information');

    browser
      // wait for symbols to appear
      .waitForElementPresent('.InventoryGroupRole .sbol-tile', 5000, 'expected an inventory item')
      // expect one focused construct viewer
      .assert.countelements(".construct-viewer", 1);
      // drag one block to first construct
      dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(1) .RoleSvg', 10, 10, '.construct-viewer[data-index="0"] .sceneGraph', 600, 60);
    browser
      .pause(250)
      // we should have a single focused block, so changing its text should change the displayed block
      .clearValue('.Inspector .InputSimple-input')
      .setValue('.Inspector .InputSimple-input', ['Donald Trump', browser.Keys.ENTER])
      // expect the construct title to be updated
      .assert.containsText('[data-nodetype="block"] .nodetext', 'Donald Trump');

    // click the construct title to focus it in inspector
      clickConstructTitle(browser, 'New Construct');
    browser
      .clearValue('.Inspector .InputSimple-input')
      .setValue('.Inspector .InputSimple-input', ['Hillary Clinton', browser.Keys.ENTER])
      .pause(500)
      .assert.containsText('.construct-viewer .title-and-toolbar .title', 'Hillary Clinton');
    browser
      // focus the project and change its title
      .click('.ProjectHeader .title-and-toolbar .title')
      .pause(500)
      .clearValue('.Inspector .InputSimple-input')
      .setValue('.Inspector .InputSimple-input', ['Bernie Saunders', browser.Keys.ENTER])
      .pause(500)
      .assert.containsText('.ProjectHeader .title-and-toolbar .title .text', 'Bernie Saunders')
      .saveScreenshot('./test-e2e/current-screenshots/focus-block-construct-project.png')
      .end();
  }
};
