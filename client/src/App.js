import React, { Component } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import uuidv4 from 'uuid/v4';

import logo from './logo.svg';
import FormEditor from './FormEditor';
import FormResponses from './FormResponses';
import FormView from './FormView';
import sampleFormData from './sampleFormData.json';
import sampleFormSchema from './sampleFormSchema.json';
import sampleFormUiSchema from './sampleFormUiSchema.json';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    /**
     * mode enums
     * ==========
     * - form-index: list all forms
     * - form-editor: edit a form
     * - form-resp: view form responses
     */
    this.state = {
      mode: 'form-index',
      forms: []
    };

    this.onCreateForm = () => {
      this.setState({
        mode: 'form-editor',
        currentFormId: uuidv4(),
        currentFormSchema: sampleFormSchema,
        currentFormUiSchema: sampleFormUiSchema,
        currentFormData: sampleFormData,
      });
    };

    this.openFormHandler = (id) => () => {
      fetch('/api/forms/' + id).then(r => {
        if (r.ok) {
          return r.json().then(form => {
            this.setState({
              mode: 'form-editor',
              currentFormId: id,
              currentFormSchema: form.schema,
              currentFormUiSchema: form.uiSchema
            });
          });
        } else {
          return Promise.reject(new Error('加载表单数据失败：HTTP ' + r.status + ' ' + r.statusText));
        }
      }).catch(err => {
        alert(err.message);
      });
    };

    this.switchToFormResponsesMode = () => { this.setState({mode: 'form-resp'}); }
    this.switchToFormEditorMode = () => { this.setState({mode: 'form-editor'}); }
    this.switchToFormsIndexMode = () => { this.setState({mode: 'form-index'}); }
  }

  componentDidMount() {
    fetch('/api/forms').then(r => {
      if (r.ok) {
        return r.json().then(forms => {
          this.setState({forms});
        });
      } else {
        return Promise.reject(new Error('加载表单列表失败：HTTP ' + r.status + ' ' + r.statusText));
      }
    }).catch(err => {
      alert(err.message);
    });
  }

  render() {
    if (this.state.mode === 'form-editor') {
      return this.renderFormEditor();
    } else if (this.state.mode === 'form-resp') {
      return this.renderFormResponses();
    } else {
      return this.renderFormIndex();
    }
  }

  renderFormEditor() {
    return (
      <FormEditor
        formId={this.state.currentFormId}
        schema={this.state.currentFormSchema || {}}
        uiSchema={this.state.currentFormUiSchema || {}}
        formData={this.state.currentFormData || {}}
        backTitle='所有表单'
        onBackPressed={this.switchToFormsIndexMode}
        onResponsesPressed={this.switchToFormResponsesMode}
      />
    );
  }

  renderFormIndex() {
    return (
      <div>
        {/* nav bar */}
        <div className='navbar navbar-default'>
          <div className="container-fluid">
            <div className="navbar-header">
              <span className="navbar-brand">
                <img alt='logo' src='/favicon.ico'/>
                Grand Forms
              </span>
            </div>
            <div className="navbar-right">
              <button type='button' className='btn btn-success navbar-btn' onClick={this.onCreateForm}>创建表单</button>
            </div>
          </div>
        </div>

        <div className='col-sm-12'>
          <h2>所有表单</h2>
          <ul className='forms'>
            {
              this.state.forms.map(f =>
                <li key={f.id}>
                  <a className='edit' href='#' onClick={this.openFormHandler(f.id)}>{f.title}</a>
                </li>
              )
            }
          </ul>
        </div>

        {/* XXX not rendered()? */}
        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
        />
      </div>
    );
  }

  renderFormResponses() {
    return <FormResponses
      formId={this.state.currentFormId}
      title={this.state.currentFormSchema ? this.state.currentFormSchema.title : undefined}
      backTitle='编辑表单'
      onBackPressed={this.switchToFormEditorMode}
    />;
  }

  switchToFormResponsesMode
  switchToFormResponsesMode() {
  }

  switchToFormsIndexMode() {
  }
}

export default App;
