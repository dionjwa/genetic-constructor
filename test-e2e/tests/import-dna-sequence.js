var homepageRegister = require('../fixtures/homepage-register');
var dragFromTo = require('../fixtures/dragfromto');
var openNthBlockContextMenu = require('../fixtures/open-nth-block-contextmenu');
var clickNthContextMenuItem = require('../fixtures/click-popmenu-nth-item');
var clickMainMenu = require('../fixtures/click-main-menu');
var newProject = require('../fixtures/newproject');
var size = require('../fixtures/size');
var openInventoryPanel = require('../fixtures/open-inventory-panel');

module.exports = {
  'Import a DNA sequence into a sketch block' : function (browser) {

    size(browser);

    // register via fixture
    homepageRegister(browser);

    // now we can go to the project page
    browser
      // wait for inventory and inspector to be present
      .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups')
      .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector');


    // start with a fresh project
    newProject(browser);
    openInventoryPanel(browser, 'Sketch');

    browser
    // double check there are no construct viewers present
      .assert.countelements('.construct-viewer', 1);

    // add block to construct
    dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(1) .RoleSvg', 10, 10, '.construct-viewer[data-index="0"] .sceneGraph', 600, 60);

    browser
      // expect one construct view and one block
      .assert.countelements('.construct-viewer', 1)
      .assert.countelements('[data-nodetype="block"]', 1);

    browser.pause(5000)
      .waitForElementNotPresent('.ribbongrunt-visible');

    openNthBlockContextMenu(browser, '.sceneGraph', 0);
    clickNthContextMenuItem(browser, 4);

    // wait for the import DNA modal window
    browser
      .waitForElementPresent('.importdnaform', 5000, 'expected the import form')
      // it should contain a text area if there was a selected block
      .waitForElementPresent('.importdnaform textarea', 5000, 'expected a text area')
      // enter a BAD sequence
      .setValue('.importdnaform textarea', 'XXXX')
      // expect to get a zero length sequence
      .assert.containsText('.importdnaform p.length', 'Length: 0')
      // set a valid sequence with white space and newlines
      .clearValue('.importdnaform textarea')
      .setValue('.importdnaform textarea', 'acgtu ryswk mbdhv n.-')
      // expect a message about a valid 18 character sequence ( with white space etc removed )
      .assert.containsText('.importdnaform p.length', 'Length: 18')
      // submit the form with the valid sequence
      .submitForm('.importdnaform')
      // wait for the grunt ribbon to confirm,
      .waitForElementPresent('.ribbongrunt-visible', 5000, 'expected a grunt')
      .assert.containsText('.ribbongrunt-visible', 'Sequence was successfully inserted.')
      .end();
  },
};
