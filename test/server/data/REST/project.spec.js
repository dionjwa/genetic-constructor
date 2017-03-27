import { expect, assert } from 'chai';
import uuid from 'node-uuid';
import request from 'supertest';
import { testUserId } from '../../../constants';
import { updateProjectWithTestAuthor } from '../../../_utils/userUtils';
import Rollup from '../../../../src/models/Rollup';
import Project from '../../../../src/models/Project';
import * as projectPersistence from '../../../../server/data/persistence/projects';
import devServer from '../../../../server/server';
import * as lodash from 'lodash';

describe('Server', () => {
  describe('Data', () => {
    describe('REST', () => {
      describe('Projects', () => {
        let server;
        const userId = testUserId; //for test environment
        const initialFields = { initial: 'value' };
        const projectData = new Project(updateProjectWithTestAuthor(initialFields));
        const projectId = projectData.id;

        const invalidDataProject = Object.assign({}, projectData, { metadata: 'blah' });

        const roll = Rollup.fromArray(projectData);

        before(() => {
          return projectPersistence.projectWrite(projectId, roll, userId);
        });

        beforeEach('server setup', () => {
          server = devServer.listen();
        });
        afterEach(() => {
          server.close();
        });

        it('sends 404 if no id provided', (done) => {
          const url = `/data/`;
          request(server)
            .get(url)
            .expect(404)
            .end(done);
        });

        it('GET invalid project ID returns a 400', (done) => {
          const url = `/data/fakeId`;
          request(server)
            .get(url)
            .expect(400)
            .expect(result => {
              expect(result.body).to.be.empty;
            })
            .end(done);
        });

        it('GET a not real project returns 404', (done) => {
          const url = `/data/${uuid.v4()}`;
          request(server)
            .get(url)
            .expect(404, done);
        });

        it('GET an existing project returns the project', (done) => {
          const url = `/data/${projectId}`;
          request(server)
            .get(url)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect(result => {
              assert(Project.compare(result.body, projectData), 'projects should match');
            })
            .end(done);
        });

        it('GET all projects returns last updated project ID in response header', (done) => {
          const url = '/data/projects';
          request(server)
            .get(url)
            .expect(200)
            .expect('Content-Type', /json/)
            .expect(result => {
              assert(result.get('Last-Project-ID') != null, '\'Last-Project-Id\' not found in response header');
              assert(result.get('Last-Project-ID') === projectData.id, 'incorrect \'Last-Project-Id\' value');
              assert(Array.isArray(result.body));
            })
            .end(done);
        });

        //future
        //it('GET supports a depth query parameter');

        it('POST updates a project returns it', (done) => {
          const url = `/data/${projectId}`;
          request(server)
            .post(url)
            .send(projectData)
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, result) => {
              if (err) {
                done(err);
              }
              assert(Project.compare(result.body, projectData), 'projects should match');

              projectPersistence.projectGet(projectId)
                .then((result) => {
                  assert(Project.compare(result.project, projectData), 'projects should match');
                  done();
                })
                .catch(done);
            });
        });

        it('POST validates the project', (done) => {
          const url = `/data/${projectId}`;

          request(server)
            .post(url)
            .send(invalidDataProject)
            .expect(422, done);
        });

        it('POST with wrong ID gives 400', (done) => {
          const url = `/data/${projectId}`;
          const newProject = new Project({
            id: 'randomId',
            owner: testUserId,
          });

          request(server)
            .post(url)
            .send(newProject)
            .expect(400, done);
        });

        it('PUT is not allowed', (done) => {
          const url = `/data/${projectId}`;
          request(server)
            .put(url)
            .send({})
            .expect(405, done);
        });

        it('DELETE is not allowed', (done) => {
          const url = `/data/${projectId}`;
          request(server)
            .delete(url)
            .expect(405, done);
        });

        it('Loader Support GET adds block and component to project', (done) => {
          const url = `/data/loadersupport/savecomponent/${projectId}`;
          request(server)
            .get(url)
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, result) => {
              if (err) {
                done(err);
              }

              assert((result.body.data.project.components.length - projectData.components.length) == 1,
                'expected 1 more project component');
              assert(lodash.keys(result.body.data.blocks).length == 1, 'expected 1 more block');
              done();
            });
        });
      });
    });
  });
});
