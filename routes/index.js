const express = require('express');
const fetch = require('node-fetch')
const FormData = require('form-data');
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
 * Make a rejected Promise from a failed Fetch Response.
 *
 * @arg {Response} r
 * @return {Promise} always rejects with an Error object.
 */
function errorMessageOfResponse(r) {
  var statusMessage = 'HTTP ' + r.status + ' ' + r.statusText;

  if (/^text\/html;/.test(r.headers.get('content-type'))) {
    return Promise.reject(new Error(statusMessage));
  }
  return r.text().then(message => Promise.reject(new Error(statusMessage + (message ? ': ' + message : ''))));
}

/**
 * list forms.
 */
function handleFormIndexReq(req, res) {
  return readdir(path.join(dataDir, 'forms')).then((files) => {
    var readings = files.filter(name => /^[0-9a-zA-Z-_]+\.json$/.test(name))
      .map(name => {
        const id = name.substr(0, name.length - 5);
        return readFormConfig(id).then(conf => {
          if (conf.schema) {
            return { id, title: conf.schema.title };
          }
          return null;
        });
      }).filter(f => f !== null);
    return Promise.all(readings);
  }).then(forms => {
    res.send(forms);
  }).catch(err => {
    if (err.code === 'ENOENT') // empty result
      res.send('[]');
    else
      res.status(500).send(err.message);
  });
}

function handleFormPut(req, res) {

  res.setHeader('content-type', 'text/plain');
  if (req.headers['content-type'] !== 'application/json') {
    res.status(400).send('invalid content-type, expect application/json, actual ' + req.headers['content-type'] + '.');
  } else {
    return getRawBody(req, {
      length: req.headers['content-length'],
      limit: '20mb'
    }).then(buf => {
      // validate
      try {
        JSON.parse(buf.toString());
      } catch (err) {
        res.status(400).send('bad JSON: ' + err.message);
        return;
      }

      // save
      mkdirpPromise(path.join(dataDir, 'forms')).then(dir => {
        var filename = path.join(dataDir, 'forms', req.params.id + '.json');
        return writeFile(filename, buf);
      }).then(() => {
        res.status(204).end();
      }).catch(err => {
        logger.error(err);
        res.status(500).send(err.message);
      });
    });
  }
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
  readFormConfig(req.params.id).then(formConf => {
    const schema = formConf.schema;
    var respDir = path.join(dataDir, 'responses', req.params.id);
    return readdir(respDir).then(files => {
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
  var confFile = path.join(dataDir, 'forms', req.params.id + '.json');
  var confFileDel = path.join(trashDir, req.params.id + '.json');

  mkdirpPromise(trashDir).then(() => {
    // delete schema
    return new Promise((resolve, reject) => {
      fs.rename(confFile, confFileDel, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }).then(() => {
    res.status(204).end();
  }).catch(err => {
    if (err.code === 'ENOENT') {
      res.status(404).end();
    } else {
      res.status(500).send(err.message);
    }
  });
}

/**
 * 提交表单。
 */
function handleFormPost(req, res) {
  // 用户提交了表单
  res.setHeader('content-type', 'text/plain');
  if (req.headers['content-type'] !== 'application/json') {
    res.status(400).send('invalid content-type, expect application/json, actual ' + req.headers['content-type'] + '.');
  } else {
    readFormConfig(req.params.id, null).then(formConf => {
      const {schema, destination} = formConf;
      return getRawBody(req, {
        length: req.headers['content-length'],
        limit: '20mb'
      }).then(buf => {
        logger.debug('post form data:', buf);

        if (!destination || destination.type === 'default') {
          var outputDir = path.join(dataDir, 'responses', req.params.id);
          var filename = new Date().getTime() + '_' + uuidv4().substr(0, 4) + '.json';
          var outputPath = path.join(outputDir, filename);
          return mkdirpPromise(outputDir).then(() => writeFile(outputPath, buf));
        } else if (destination.type === 'web') {
          logger.debug('submit to web API', destination.url);
          var body;
          var contentType = destination['contentType'];
          if (contentType === 'application/json') {
            body = buf;
          } else if (contentType === 'application/x-www-form-urlencoded') {
            var obj = JSON.parse(buf.toString());
            body = Object.entries(obj).map(arr =>
              encodeURIComponent(arr[0]) + '=' + encodeURIComponent(arr[1])).join('&');
          } else if (contentType === 'multipart/form-data') {
            var obj = JSON.parse(buf.toString());
            body = new FormData();
            Object.entries(obj).forEach(arr => {
              body.append(arr[0], arr[1].toString());
            });
          } else {
            throw new Error(`destination type of web with content type ${contentType} is not implemented`);
          }
          return fetch(destination.url, {
            method: 'POST',
            headers: {
              "Content-Type": contentType,
            },
            body
          }).then(r => {
            if (r.ok) {
              return r.status;
            } else {
              return errorMessageOfResponse(r);
            }
          });
        } else if (destination.type === 'db') {
          var data = JSON.parse(buf.toString());
          var grandFormsIoUrl = 'http://localhost:3002/api/submit';
          return fetch(grandFormsIoUrl, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              schema,
              destination,
              data
            })
          }).then(r => {
            if (r.ok) {
              return r.status;
            } else {
              return errorMessageOfResponse(r);
            }
          });
        } else {
          throw new Error(`destination type of "${destination.type}" is not implemented.`);
        }
      });
    }).then(() => {
      res.status(204).end();
    }).catch(err => {
      logger.error(err);
      res.status(500).end((err.name ? err.name + ': ' : '') + err.message)
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

  readFormConfig(req.params.id).then(form => {
    res.send(form);
  }).catch(err => {
    if (err.code === 'ENOENT') {
      res.status(404).send('找不到表单 ' + req.params.id);
    } else {
      logger.error(err);
      res.status(500).send(err.message);
    }
  });
}

/**
 * call mkdirp() and return a Promise.
 */
function mkdirpPromise(dir) {
  return new Promise((resolve, reject) => {
    mkdirp(dir, err => {
      if (err) {
        reject(err);
      } else {
        resolve(dir);
      }
    });
  });
}

/**
 * Call fs.readdir and return a Promise.
 * @return {Promise} resolve with File array.
 */
function readdir(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err)
        reject(err);
      else
        resolve(files);
    });
  });
}

/**
 * read form schema.
 *
 * @arg {string} id form id
 * @return {object} or null.
 */
function readFormConfig(id) {
  var filename = dataDir + `/forms/${id}.json`;
  return readFile(filename).then(buf => JSON.parse(buf.toString()));
}

/**
 * Call fs.writeFile and return a Promise.
 *
 * @return {Promise}
 */
function writeFile(outputPath, buf) {
  return new Promise((resolve, reject) => {
    fs.writeFile(outputPath, buf, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = router;
