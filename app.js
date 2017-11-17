// vim: sw=2

'use strict';

const express = require('express');
var minify = require('express-minify');
const app = express();
const logger = require('logger').createLogger();

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

app.use(express.static(__dirname + '/public'));
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

// routes
app.use('/', require('./routes/index'));

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
