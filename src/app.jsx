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
      <h1>{global.siteName || '{siteName}'}</h1>
      <button className='btn btn-primary form-new' onClick={onCreateForm}>创建表单</button>
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
