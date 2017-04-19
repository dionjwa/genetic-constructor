var homepageRegister = require('../fixtures/homepage-register');
var dragFromTo = require('../fixtures/dragfromto');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var size = require('../fixtures/size');

module.exports = {
  'Test that dropping on the project canvas creates a new construct.' : function (browser) {
    size(browser);
    homepageRegister(browser);

    // now we can go to the project page
    browser
      // wait for inventory and inspector to be present
      .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups')
      .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector')
      .click('.construct-viewer .inline-toolbar img[data-id="Delete Construct"]')
      .waitForElementNotPresent('.construct-viewer', 500, 'Clicked to delete only construct, and now the canvas is empty.')
      .assert.countelements('.inter-construct-drop-target', 1, 'When canvas is empty, there is exactly one drop target.');

    openInventoryPanel(browser, 'Sketch');
    dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(1) .RoleSvg', 27, 27, '.inter-construct-drop-target', 600, 400);

    browser
      .waitForElementPresent('.construct-viewer', 500, 'After dragging in a block, a construct was created.');

    // generate image for testing.
    browser
      .saveScreenshot('./test-e2e/current-screenshots/drag-to-create-construct.png')
      .end();
  }
};
