const assert = require('assert');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const readFile = require('fs-readfile-promise');
const url = require('url');

const HOMEPAGE = 'http://localhost/grand-forms';

describe('Build', () => {

  it('check local index.html at client build directory', (done) => {
    loadIndexFile().then(indexHtml => {
      done();

      // parse bundle JS URI
      // there should be a script tag:
      // <script type="text/javascript" src="/grand-forms/static/js/main.ed56bfad.js"></script>
      var bundleJsUri = undefined;
      var m = indexHtml.match(/<script type="text\/javascript" src="([^"]+)"/i);
      if (m) {
        bundleJsUri = m[1];
      }

      describe('HTTP server (frontend)', () => {
        it(`check ${HOMEPAGE}`, testHomepage(HOMEPAGE));

        it(`check ${HOMEPAGE}/`, testHomepage(HOMEPAGE + '/'));

        it(`check ${HOMEPAGE}/index.html`, testHomepage(HOMEPAGE + '/index.html'));

        it(`check ${HOMEPAGE}/forms/foo (URL rewriting for client-side routing)`,
          testHomepage(HOMEPAGE + '/forms/foo'));

        var bundleJsUrl;
        if (bundleJsUri.startsWith('/')) {
          var u = url.parse(HOMEPAGE);
          bundleJsUrl = u.protocol + '//' + u.host + bundleJsUri;
        } else {
          bundleJsUrl = HOMEPAGE + bundleJsUri;
        }

        it(`check ${bundleJsUrl}`, (done) => {
          fetch(`${bundleJsUrl}`, { method: 'HEAD' }).then(r => {
            assert.ok(r.ok, 'HTTP ' + r.status);
            assert.equal(r.headers.get('content-type').split(';')[0], 'application/javascript');
            done();
          }).catch(done);
        });

        it(`check ${HOMEPAGE}/manifest.json`, (done) => {
          fetch(`${HOMEPAGE}/manifest.json`).then(r => {
            assert.ok(r.ok, 'HTTP ' + r.status);
            assert.equal(r.headers.get('content-type').split(';')[0], 'application/json');
            return r.json().then(d => {
              assert.equal(d.name, 'Grand Forms');
              done();
            });
          }).catch(done);
        });
      });

      describe('HTTP server (backend)', () => {
        it(`check ${HOMEPAGE}/api/whoami`, (done) => {
          fetch(`${HOMEPAGE}/api/whoami`).then(r => {
            assert.ok(r.ok, 'HTTP ' + r.status);
            assert.equal(r.headers.get('content-type').split(';')[0], 'application/json');
            done();
          }).catch(err => {
            done(err);
          });
        });

        it(`check ${HOMEPAGE}/api/forms`, (done) => {
          fetch(`${HOMEPAGE}/api/forms`).then(r => {
            assert.ok(r.ok, 'HTTP ' + r.status);
            assert.equal(r.headers.get('content-type').split(';')[0], 'application/json');
            done();
          }).catch(err => {
            done(err);
          });
        });

        it(`check POST ${HOMEPAGE}/api/forms/foo`, (done) => {
          fetch(`${HOMEPAGE}/api/forms/foo`, { method: 'POST', body: 'dummy' }).then(r => {
            assert.equal(r.status, 400);
            done();
          }).catch(err => {
            done(err);
          });
        });

        it(`check ${HOMEPAGE}/api/none (a non-existing API)`, (done) => {
          fetch(`${HOMEPAGE}/api/none`).then(r => {
            assert.equal(r.status, 404);
            done();
          }).catch(done);
        });
      });
    }).catch(done);
  });

});

function loadIndexFile() {
  return readFile(path.resolve(__dirname, '..', 'client', 'build', 'index.html')).then(data => {
    return data.toString();
  });
}

function testHomepage(url) {
  return (done) => {
    fetch(url).then(r => {
      assert.ok(r.ok, 'HTTP ' + r.status);
      assert.equal(r.headers.get('content-type').split(';')[0], 'text/html');
      return Promise.all([r.text(), loadIndexFile()]).then(([net, local]) => {
        assert.equal(net, local);
        done();
      });
    }).catch(err => {
      done(err);
    });
  }
}
