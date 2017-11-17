import React, { Component } from "react";
import { render } from "react-dom";
import uuidv4 from 'uuid/v4';

import FormEditor from '../src/FormEditor.jsx';
import FormView from '../src/FormView.jsx';

function onCreateForm() {
  window.location = '/forms/' + uuidv4() + '/edit';
}

function renderForm() {

  if (!global.schema) {
    console.error('invalid global.schema');
  }

  render((
    <FormView
      schema={global.schema}
      uiSchema={global.uiSchema}
    />
  ), document.getElementById("app"));
}

function renderFormEditor() {
  render((<FormEditor
    schema={global.schema}
    uiSchema={global.uiSchema}
  />
  ), document.getElementById("app"));
}

function renderHome() {
  render((
    <div>
      {/* nav bar */}
      <div className='navbar navbar-default'>
        <div className="container-fluid">
          <div className="navbar-header">
            <span className="navbar-brand">
              <img alt='logo' src='/favicon.ico'/>
              {global.siteName || '{siteName}'}
            </span>
          </div>
          <div className="navbar-right">
            <button type='button' className='btn btn-default navbar-btn' onClick={onCreateForm}>创建表单</button>
          </div>
        </div>
      </div>

      <h2>所有表单</h2>
      <ul className='forms'>
        {
          global.forms.map(f =>
            <li key={f.id}>
              <a className='edit' href={`/forms/${f.id}/edit`}>{f.title}</a>
            </li>
          )
        }
      </ul>
    </div>
  ), document.getElementById("app"));
}

if (global.PAGENAME === 'form-view')
  renderForm();
else if (global.PAGENAME === 'form-edit')
  renderFormEditor();
else
  renderHome();
