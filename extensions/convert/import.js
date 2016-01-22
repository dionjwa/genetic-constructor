import express from 'express';
import bodyParser from 'body-parser';
import { sessionMiddleware } from '../../server/utils/authentication';
import { load as loadExtensions } from '../requireExtensions';
const router = express.Router(); //eslint-disable-line new-cap
const jsonParser = bodyParser.json({
  strict: false, //allow values other than arrays and objects
});
const normalizedPath = require('path').join(__dirname, '.');
const retval = loadExtensions(normalizedPath);
const extensions = retval.extensions;
const manifests = retval.manifests;

router.use(sessionMiddleware);

function importProject(id, data, callback) {
  if (id in extensions) {
    const mod = extensions[id];
    if (mod.importProject) {
      try {
        mod.importProject(data)
        .then(res => {
          callback(res);
        })
        .catch(err => {
          callback({
            error: err.message,
          });
        });
      } catch (err) {
        callback({
          error: err.message,
        });
      }
      return;
    }
  }
  callback({
    error: 'No import option named ' + id + ' for projects',
  });
}

function importBlock(id, data, callback) {
  if (id in extensions) {
    const mod = extensions[id];
    if (mod.importBlock) {
      try {
        mod.importBlock(data)
        .then(res => {
          callback(res);
        })
        .catch(err => {
          callback({
            error: err.message,
          });
        });
      } catch (err) {
        callback({
          error: err.message,
        });
      }
      return;
    }
  }
  callback({
    error: 'No import option named ' + id + ' for blocks',
  });
}

router.post('/project/:id', jsonParser, (req, resp) => {
  const { id } = req.params;
  const data = req.body;
  //const key = req.headers.sessionkey;
  //const header = {'sessionkey': key, 'host': 'http://0.0.0.0:3000'};
  function callImportProj(text) {
    importProject(id, text, res => {
      if (res) {
        resp.json(res);
      } else {
        resp.json( { error: 'No result' });
      }
    });
  }
  if (data.file) {
    fs.readFile(data.file, 'utf8', (err, text) => {
      callImportProj(text);
    });
  } else {
    callImportProj(data.text);
  }
});

router.post('/block/:id', jsonParser, (req, resp) => {
  const { id } = req.params;
  const data = req.body;
  //const key = req.headers.sessionkey;
  //const header = {'sessionkey': key, 'host': 'http://0.0.0.0:3000'};
  function callImportBlock(text) {
    importBlock(id, text, res => {
      if (res) {
        resp.json(res);
      } else {
        resp.json( { error: 'No result' });
      }
    });
  }
  if (data.file) {
    fs.readFile(data.file, 'utf8', (err, text) => {
      callImportBlock(text);
    });
  } else {
    callImportBlock(data.text);
  }
});


router.get('/manifests', jsonParser, (req, resp) => {
  //const key = req.headers.sessionkey;
  //const header = {'sessionkey': key, 'host': 'http://0.0.0.0:3000'};
  resp.json(manifests);
});

//export these functions for testing purpose
router.importBlock = importBlock;
router.importProject = importProject;

module.exports = router;
