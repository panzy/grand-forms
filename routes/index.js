const express = require('express');
const fetch = require('node-fetch')
const fs = require('fs');
const getRawBody = require('raw-body');
const mkdirp = require('mkdirp');
const multiparty = require('multiparty');
const path = require('path');
const logger = require('logger').createLogger();
const readFile = require('fs-readfile-promise');
const uuidv4 = require('uuid/v4');

var router = express.Router();

const dataDir = path.dirname(__dirname) +  '/data/';

////////////////////////////////////////////////////////////////////////////////
// init

logger.setLevel(process.env.LOG_LEVEL || 'debug');

////////////////////////////////////////////////////////////////////////////////
// routes

router.get('/forms/:id/view', handleFormViewReq);
router.post('/forms/:id/view', handleFormViewReq);
router.post('/forms/:id', handleFormViewReq);
router.get('/forms/:id/edit', handleFormEditReq);
router.post('/forms/:id/edit', handleFormEditReq);
router.get('/forms/:id/resp', handleFormRespReq);
router.get('/forms/:id', handleFormViewReq);
router.get('/forms', handleFormIndexReq);
router.get('/', handleIndexReq);

////////////////////////////////////////////////////////////////////////////////
// functions
////////////////////////////////////////////////////////////////////////////////

function handleFormIndexReq(req, res) {
  fs.readdir(dataDir + 'forms/', (err, files) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      var readings = files.filter(name => /^[0-9a-zA-Z-_]+\.json$/.test(name))
        .map(name => readFile(dataDir + 'forms/' + name).then(buf => {
          var schema = JSON.parse(buf.toString());
          return {
            id: name.substr(0, name.length - 5),
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
        var filename = dataDir + 'forms/' + req.params.id + '.json';
        var data = fields.schema[0];
        fs.writeFile(filename, data, (err) => {
          if (err) {
            logger.error(err);
          }
        });
      }
      if (fields.uiSchema) {
        var filename = dataDir + 'forms/' + req.params.id + '.ui.json';
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

function handleFormRespReq(req, res) {
  var schemaFilename = path.join(dataDir, 'forms', req.params.id +  '.json');
  var readingSchema = readFile(schemaFilename).then(buf => {
    return JSON.parse(buf.toString());
  });

  readingSchema.then(schema => {
    var respDir = path.join(dataDir, 'responses', req.params.id);
    var readingDir = new Promise((resolve, reject) => {
      fs.readdir(respDir, (err, files) => {
        if (err)
          reject(err);
        else
          resolve(files);
      });
    });

    return readingDir.then(files => {
      var readingResps = files
        .filter((name, idx) => idx > files.length - 100 /* XXX 只显示最近 100 条 */
          && /^[0-9a-zA-Z-_]+\.json$/.test(name))
        .map(name => readFile(path.join(respDir, name)).then(buf => {
          return JSON.parse(buf.toString());
        }));

      return Promise.all(readingResps).then(responses => {
        //res.send({schema, responses});
        res.render('responses', {title: schema.title, schema, responses});
      });
    }, err => {
      if (err.code === 'ENOENT') {
         // no responses
        res.render('responses', {title: schema.title, schema, responses: []});
      } else {
        throw err;
      }
    });
  }, err => {
    if (err.code === 'ENOENT') {
      res.render('404', {message: '找不到表单 ' + req.params.id});
    } else {
      throw err;
    }
  }).catch(err => {
    logger.error(err);
    res.render('500', {message: err.message});
  });
}

function handleFormViewReq(req, res) {
  if (req.method === 'POST') {
    // 用户提交了表单
    if (req.headers['content-type'] !== 'application/json') {
      res.status(400).send('invalid content-type, expect application/json, actual ' + req.headers['content-type'] + '.');
    } else {
      getRawBody(req, {
        length: req.headers['content-length'],
        limit: '20mb'
      }).then(buf => {
        logger.debug('post form data:', buf);
        var outputDir = path.join(dataDir, 'responses', req.params.id);
        var filename = new Date().getTime() + '_' + uuidv4().substr(0, 4) + '.json';
        var outputPath = path.join(outputDir, filename);
        mkdirp(outputDir, err => {
          if (err) {
            logger.error(err);
            res.status(500).send(err.message);
          } else {
            fs.writeFile(outputPath, buf, (err) => {
              if (err) {
                logger.error(err);
                res.status(500).send(err.message);
              } else {
                res.send(`已保存，共 ${req.headers['content-length']} 字节。`);
              }
            });
          }
        });
      }).catch(err => {
        logger.error(err);
        res.status(500).end(err.message)
      });
    }
  } else {
    openForm('view', req, res);
  }
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

  var schemaFilename = dataDir + `/forms/${req.params.id}.json`;
  var uiSchemaFilename = dataDir + `/forms/${req.params.id}.ui.json`;

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
