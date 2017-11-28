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

router.get('/', handleIndexReq);
router.get('/api/forms', handleFormIndexReq);
router.get('/api/forms/:id', handleFormGet);
router.delete('/api/forms/:id', handleFormDelete);
router.post('/api/forms/:id', handleFormPost);
router.put('/api/forms/:id', handleFormPut);
router.get('/api/forms/:id/resp', handleFormRespReq);

////////////////////////////////////////////////////////////////////////////////
// functions
////////////////////////////////////////////////////////////////////////////////

/**
 * list forms.
 */
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
        res.send(forms);
      }).catch(err => {
        logger.error(err);
        res.status(500).send(err.message);
      });
    }
  });
}

function handleFormPut(req, res) {
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
}

/**
 * 获取表单收集的数据。
 *
 * 应答格式：JSON
 *
 * 应答数据结构： {
 *   meta: {
 *    time: $unix_time_in_seconds
 *   },
 *   schema,
 *   items: []
 * }
 *
 * 其中 items 数组中的元素就是每次 POST 上来的 JSON 对象。
 */
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
          var data = JSON.parse(buf.toString());
          data.meta = {time: name.substr(0, 10)};
          return data;
        }));

      return Promise.all(readingResps).then(items => {
        res.send({schema, items});
      });
    }, err => {
      if (err.code === 'ENOENT') {
         // no responses
        res.send({schema, items: []});
      } else {
        throw err;
      }
    });
  }, err => {
    if (err.code === 'ENOENT') {
      res.status(404).send('找不到表单 ' + req.params.id);
    } else {
      throw err;
    }
  }).catch(err => {
    logger.error(err);
    res.status(500, err.message);
  });
}

/**
 * 删除表单。
 */
function handleFormDelete(req, res) {
  // 出于以下考虑，我们并不从文件系统上删除表单文件，而只是移动到 trash 目录：
  // 1. 允许撤销；
  // 2. 表单数据(responses)不应连带删除，而表单数据需要 schema；
  var trashDir = path.join(dataDir, 'forms', 'trash');
  var schemaFile = path.join(dataDir, 'forms', req.params.id + '.json');
  var schemaFileDel = path.join(trashDir, req.params.id + '.json');
  var uiSchemaFile = path.join(dataDir, 'forms', req.params.id + '.ui.json');
  var uiSchemaFileDel = path.join(trashDir, req.params.id + '.ui.json');

  mkdirp(trashDir, err => {
    if (err) {
      logger.error(err);
      res.status(500).send(err.message);
    } else {
      // delete schema
      fs.rename(schemaFile, schemaFileDel, (err) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.status(404).end();
          } else {
            res.status(500).send(err.message);
          }
        } else {
          res.status(204).end();
        }
      });

      // delete ui schema
      fs.rename(uiSchemaFile, uiSchemaFileDel, (err) => {
        if (err && err.code !== 'ENOENT') {
          logger.error(err);
        }
      });
    }
  });
}

/**
 * 提交表单。
 */
function handleFormPost(req, res) {
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
}

function handleIndexReq(req, res) {
  res.send('Grand Forms backend');
}

/**
 * 返回表单配置信息。
 */
function handleFormGet(req, res) {

  var schemaFilename = dataDir + `/forms/${req.params.id}.json`;
  var uiSchemaFilename = dataDir + `/forms/${req.params.id}.ui.json`;

  readFile(schemaFilename).then(schemaBuf => {
    var schema = JSON.parse(schemaBuf.toString());
    var title = schema.title;
    return readFile(uiSchemaFilename).then(uiSchemaBuf => {
      var uiSchema = JSON.parse(uiSchemaBuf.toString());
      res.send({schema, uiSchema});
    }).catch(err => {
      // UI schema is optional
      res.send({schema});
    });
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
