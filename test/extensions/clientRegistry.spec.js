import sinon from 'sinon';
import { assert, expect } from 'chai';
import { registerManifest, setExtensionConfig } from '../../src/extensions/clientRegistry';
import * as downloadExtensionObj from '../../src/extensions/downloadExtension';

describe('clientRegistry', () => {
  describe('registerManifest', () => {
    let manifest;

    before(() => {
      sinon.stub(downloadExtensionObj, 'downloadExtension').callsFake(() =>
        Promise.resolve()
      );
    });
    after(() => {
      downloadExtensionObj.downloadExtension.restore();
    });

    beforeEach(() => {
      manifest = {
        name: '',
        geneticConstructor: {
          type: 'imatype',
          client: [
            {
              file: '',
              region: 'menu:block',
            },
          ],
        },
      };
    });

    describe('when registering a new active extension', () => {
      beforeEach(() => {
        manifest.name = 'newactive';
        setExtensionConfig({ [manifest.name]: { active: true }});
      });

      it('sets _activated', () => {
        const registry = registerManifest(manifest);
        expect(!!registry[manifest.name]._activated).to.equal(true);
      });
    });

    describe('when registering a new inactive extension', () => {
      beforeEach(() => {
        manifest.name = 'newinactive';
        setExtensionConfig({ [manifest.name]: { active: false }});
      });

      it('does not set _activated', () => {
        const registry = registerManifest(manifest);
        expect(!!registry[manifest.name]._activated).to.equal(false);
      });
    });

    describe('when registering an existing _activated extension', () => {
      beforeEach(() => {
        manifest.name = 'existingactivated';
        setExtensionConfig({ [manifest.name]: { active: true }});
      });

      it('does not reset the extension', () => {
        const registryOne = registerManifest(manifest);
        const registryTwo = registerManifest(manifest);
        const renderOne = registryOne[manifest.name].render;
        const renderTwo = registryTwo[manifest.name].render;

        expect(registryOne === registryTwo).to.equal(true);
      });
    });

    describe('when registering an existing extension without _activated set', () => {
      beforeEach(() => {
        manifest.name = 'existingnotactivated';
        setExtensionConfig({ [manifest.name]: { active: false }});
      });

      it('resets the extension', () => {
        const registryOne = registerManifest(manifest);
        const renderOne = registryOne[manifest.name].render;
        const registryTwo = registerManifest(manifest);
        const renderTwo = registryTwo[manifest.name].render;

        expect(renderOne === renderTwo).to.equal(false);
      });
    });
  });
});
