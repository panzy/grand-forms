import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import FormResponses from './FormResponses';
import FormView from './FormView';
//import registerServiceWorker from './registerServiceWorker';

var m = null;//window.location.pathname.match(/^\/forms\/(\w+)(?:\/(view|resp))?/);
if (m) {
  var formId = m[1];
  var action = m[2] || 'view';

  if (action === 'resp') { // view form responses
    fetch('/api/forms/' + formId + '/resp').then(r => {
      if (r.ok) {
        r.json().then(data => {
          document.title = data.schema.title + ' - Grand Forms';
          ReactDOM.render(<FormResponses schema={data.schema} items={data.items}/>, document.getElementById('root'));
        });
      } else {
        return Promise.reject(new Error('加载数据失败：HTTP ' + r.status + ' ' + r.statusText));
      }
    }).catch(err => {
      ReactDOM.render(<div>{err.message}</div>, document.getElementById('root'));
    });
  } else { // view form
    fetch('/api/forms/' + formId).then(r => {
      if (r.ok) {
        return r.json().then(form => {
          ReactDOM.render((
            <FormView
              id={formId}
              schema={form.schema || {}}
              uiSchema={form.uiSchema || {}}
            />
          ), document.getElementById('root'));
        });
      } else {
        return Promise.reject(new Error('加载表单失败：HTTP ' + r.status + ' ' + r.statusText));
      }
    }).catch(err => {
      ReactDOM.render(<div>{err.message}</div>, document.getElementById('root'));
    });
  }
} else {
  ReactDOM.render(<App />, document.getElementById('root'));
  //registerServiceWorker();

  // Implementing the HMR Interface.
  if (module.hot) {
    module.hot.accept('./App', () => {
      console.log('hot accept')
      const NextApp = require('./App').default
      ReactDOM.render(
        <NextApp />,
        document.getElementById('root')
      )
    })
  }
}
