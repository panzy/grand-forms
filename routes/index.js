const express = require('express');
const fetch = require('node-fetch')
const fs = require('fs');
const mkdirp = require('mkdirp');
const multiparty = require('multiparty');
const path = require('path');
const logger = require('logger').createLogger();
const readFile = require('fs-readfile-promise');

var router = express.Router();

const dataDir = path.dirname(__dirname) +  '/data/';

////////////////////////////////////////////////////////////////////////////////
// init

logger.setLevel(process.env.LOG_LEVEL || 'debug');

////////////////////////////////////////////////////////////////////////////////
// routes

router.get('/forms/:id/view', handleFormViewReq);
router.get('/forms/:id/edit', handleFormEditReq);
router.post('/forms/:id/edit', handleFormEditReq);
router.get('/forms/:id', handleFormViewReq);
router.get('/forms', handleFormIndexReq);
router.get('/', handleIndexReq);

////////////////////////////////////////////////////////////////////////////////
// functions
////////////////////////////////////////////////////////////////////////////////

function handleFormIndexReq(req, res) {
  fs.readdir(dataDir, (err, files) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      var readings = files.filter(name => /^schema-.*\.json$/.test(name))
        .map(name => readFile(dataDir + name).then(buf => {
          var schema = JSON.parse(buf.toString());
          return {
            id: name.substr(7, name.length - 12),
            title: schema.title,
          }
        }));
      Promise.all(readings).then(forms => {
        res.render('index', {forms});
      }).catch(err => {
        logger.error(err);
        res.status(500).send(err.message);
      });
    }
  });
}

function handleFormEditReq(req, res) {
  if (req.method === 'POST') {
    // post schema

    var form = new multiparty.Form();

    form.parse(req, function(err, fields, files) {
      logger.debug('form editor post fields', fields);

      // validate
      if (fields.schema) {
        try {
          JSON.parse(fields.schema[0]);
        } catch (err) {
          res.status(400).send('invalid schema: ' + err.message);
          return;
        }
      }
      if (fields.uiSchema) {
        try {
          JSON.parse(fields.uiSchema[0]);
        } catch (err) {
          res.status(400).send('invalid UI schema: ' + err.message);
          return;
        }
      }

      // save
      if (fields.schema) {
        var filename = dataDir + 'schema-' + req.params.id + '.json';
        var data = fields.schema[0];
        fs.writeFile(filename, data, (err) => {
          if (err) {
            logger.error(err);
          }
        });
      }
      if (fields.uiSchema) {
        var filename = dataDir + 'uischema-' + req.params.id + '.json';
        var data = fields.uiSchema[0];
        fs.writeFile(filename, data, (err) => {
          if (err) {
            logger.error(err);
          }
        });
      }
      res.send('ok');
    });
  } else {
    openForm('edit', req, res);
  }
}

function handleFormViewReq(req, res) {
  openForm('view', req, res);
}

function handleIndexReq(req, res) {
  handleFormIndexReq(req, res);
}

/**
 * 处理表单的预览或编辑请求。
 *
 * @arg {string} mode "view" or "edit".
 * @arg {Request} req
 * @arg {Response} res
 */
function openForm(mode, req, res) {

  var schemaFilename = dataDir + `schema-${req.params.id}.json`;
  var uiSchemaFilename = dataDir + `uischema-${req.params.id}.json`;

  readFile(schemaFilename).then(schemaBuf => {
    var schema = schemaBuf.toString();
    var title = JSON.parse(schema).title;
    return readFile(uiSchemaFilename).then(uiSchemaBuf => {
      var uiSchema = uiSchemaBuf.toString();
      res.render('form', {
        mode,
        title,
        schema,
        uiSchema,
      });
    }).catch(err => {
      // UI schema is optional
      res.render('form', {
        mode,
        title,
        schema,
      });
    });
  }, err => {
    if (mode === 'edit' && err.code === 'ENOENT') {
      // 创建新表单
      res.render('form', {
        mode,
      });
    } else {
      throw err;
    }
  }).catch(err => {
    if (err.code === 'ENOENT') {
      res.status(404).send('找不到表单 ' + req.params.id);
    } else {
      logger.error(err);
      res.status(500).send(err.message);
    }
  });
}


module.exports = router;
