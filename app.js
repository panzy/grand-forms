// vim: sw=2

'use strict';

const express = require('express');
var minify = require('express-minify');
const app = express();
const logger = require('logger').createLogger();
const path = require('path');

////////////////////////////////////////////////////////////////////////////////
// app variables
////////////////////////////////////////////////////////////////////////////////

app.locals.siteName = 'Grand Forms';
app.locals.logger = logger;

////////////////////////////////////////////////////////////////////////////////

// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
//app.use(require('serve-favicon'));

// use express-minify
if (process.env.NO_MINIFY !== 'true') {
  app.use(function(req, res, next) {
    // for all *.min.css or *.min.js, do not minify it
    if (/\.min\.(css|js)$/.test(req.url)) {
      res._no_minify = true;
    }
    // bundle.js 是否 minify 由 build 过程 (npm run build[-prod]) 决定，
    // 而且 express-minify 所使用的 uglify-js 也不支持 ES6。
    if (/\/bundle.js$/.test(req.url)) {
      res._no_minify = true;
    }
    next();
  });
  app.use(minify());
}

// 静态目录指向 client 子工程的 webpack build。
app.use(express.static(path.join(__dirname, 'client', 'build')));
app.use(require('morgan')('dev'));
app.use(require('method-override')());

// setup express-session
var Session = require('express-session');
var FileStore = require('session-file-store')(Session);
var session = Session({
  store: new FileStore({}),
  secret: 'k+da0!Mz',
  resave: true,
  saveUninitialized: true
});
app.set('trust proxy', 1) // trust first proxy
app.use(session);

//
// routes
//
app.use('/', require('./routes/index'));
// 由于采用了 Client-Side Routing，
// 对于符合以下条件的 URI，总是应答 index.html：
// A. 不是静态文件，且
// B. 不是 API
app.get(/^(?!api\/)/, function (req, res) {
  // 访问不存在的 API 时，路由会进入这里，这时我们
  // 不想返回 index.html，而是 HTTP 404。
  if (req.path.startsWith('/api')) {
    return res.sendStatus(404);
  }
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

app.onSocketioAttached = (io) => {
};

////////////////////////////////////////////////////////////////////////////////
// start
////////////////////////////////////////////////////////////////////////////////

logger.setLevel(process.env.LOG_LEVEL || 'info');
logger.format = (level, date, message) => {
  return level + ' [' + moment().format('YYYY-MM-DD HH:mm:ss') + ']' + message;
};

////////////////////////////////////////////////////////////////////////////////
// functions
////////////////////////////////////////////////////////////////////////////////


if (!String.prototype.encodeHTML) {
  String.prototype.encodeHTML = function () {
    return this.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
}

if (!String.prototype.decodeHTML) {
  String.prototype.decodeHTML = function () {
    return this.replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&');
  };
}

////////////////////////////////////////////////////////////////////////////////
// exports
module.exports = app;
