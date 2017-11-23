import React, { Component } from "react";
import AceEditor from 'react-ace';
import Form from "react-jsonschema-form";

// AceEditor themes
import brace from 'brace';
import 'brace/mode/json';
import 'brace/theme/monokai';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import Navbar from './Navbar';

// react-toastify 似乎不兼容 react@16.
const toastStub = {
  success: (msg) => alert(msg),
  error: (msg) => alert(msg),
};

const LOADING = 0;
const LOADED = 1;
const LOAD_FAILED = 2;

/**
 * @prop {string} id
 */
class FormEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: LOADING,
      schema: null, // object
      uiSchema: null, // object
      schemaJson: null, // JSON
      uiSchemaJson: null, // JSON
      formData: null,
    };

    this.handleSchemaChange = this.handleSchemaChange.bind(this);
    this.handleUiSchemaChange = this.handleUiSchemaChange.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    if (window.location.search.indexOf('new=1') !== -1) {
      this.setState({
        schema: {},
        uiSchema: {},
        schemaJson: '{}',
        uiSchemaJson: '{}',
        loading: LOADED,
      });
    } else {
      this.setState({loading: LOADING});
      fetch('/api/forms/' + this.props.id).then(r => {
        if (r.ok) {
          return r.json().then(form => {
            this.setState({
              schema: form.schema,
              uiSchema: form.uiSchema,
              schemaJson: JSON.stringify(form.schema, null, "  "),
              uiSchemaJson: JSON.stringify(form.uiSchema, null, "  "),
              loading: LOADED,
            });
          });
        } else {
          return Promise.reject(new Error('加载表单数据失败：HTTP ' + r.status + ' ' + r.statusText));
        }
      }).catch(err => {
        console.error(err);
        alert(err.message);
        this.setState({loading: LOAD_FAILED});
      });
    }
  }

  handleSchemaChange(value, event) {
    var schema = this.state.schema;
    try {
      schema = JSON.parse(value);
    } catch(err) {
    }
    this.setState({schema, schemaJson: value});
  }

  handleUiSchemaChange(value, event) {
    var uiSchema = this.state.uiSchema;
    try {
      uiSchema = JSON.parse(value);
    } catch(err) {
    }
    this.setState({uiSchema, uiSchemaJson: value});
  }

  handleDelete() {
    fetch('/api/forms/' + this.props.id, { method: 'DELETE' }).then(r => {
      if (r.ok) {
        toastStub.success('表单已删除');
      } else {
        toastStub.error('删除失败： ' + r.status + ' ' + r.statusText);
        r.text().then(text => console.error(text));
      }
    });
  }

  handleSubmit(event) {
    var data = new FormData();
    console.log('form editor state', this.state);
    data.append('schema', this.state.schemaJson);
    data.append('uiSchema', this.state.uiSchemaJson);
    fetch('/api/forms/' + this.props.id, { method: 'PUT', body: data }).then(r => {
      if (r.ok) {
        toastStub.success('已保存');
      } else {
        toastStub.error('保存失败： ' + r.status + ' ' + r.statusText);
        r.text().then(text => console.error(text));
      }
    });
    event.preventDefault();
  }

  render() {

    var navbar, body;

    if (this.state.loading === LOADING) {
      navbar = <Navbar/>;
      body = <div className='alert alert-info'>正在加载表单...</div>;
    } else if (this.state.loading === LOAD_FAILED) {
      navbar = <Navbar/>;
      body = <div className='alert alert-danger'>加载表单失败</div>;
    } else if (this.state.loading === LOADED) {

      var viewUrl = '/forms/' + this.props.id + '/view';
      var respUrl = '/forms/' + this.props.id + '/resp';

      navbar = (
        <Navbar
          title={this.state.schema && this.state.schema.title ? this.state.schema.title : '未命名表单'}
          backUrl='/'
          backTitle='所有表单'
          actions={[
            <a href='#' onClick={this.handleSubmit}>保存</a>,
            <a href={viewUrl} target='_blank'>使用表单</a>,
            <a href={respUrl} target='_blank'>查看数据</a>,
            <a href='#' onClick={this.handleDelete}>删除表单</a>,
          ]}
        />
      );

      var preview = <Form
        schema={this.state.schema || {}}
        uiSchema={this.state.uiSchema || {}}
        formData={this.state.formData}/>;

      body = <div className='form-editor'>
        {/* schema editor, ui schema editor, preview */}
        <div>
          <div className='col-sm-9'>
            <form onSubmit={this.handleSubmit}>
              <div className='col-sm-7'>
                <h2>Schema</h2>
                <AceEditor
                  name='schema'
                  width='100%'
                  mode="json"
                  theme="monokai"
                  onChange={this.handleSchemaChange}
                  fontSize={14}
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={false}
                  value={this.state.schemaJson}
                  editorProps={{$blockScrolling: true}}
                  setOptions={{
                    showLineNumbers: true,
                      tabSize: 2,
                  }}/>
              </div>
              <div className='col-sm-5'>

                <h2>UI Schema</h2>
                <AceEditor
                  name='uiSchema'
                  width='100%'
                  mode="json"
                  theme="monokai"
                  onChange={this.handleUiSchemaChange}
                  fontSize={14}
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={false}
                  value={this.state.uiSchemaJson}
                  editorProps={{$blockScrolling: true}}
                  setOptions={{
                    showLineNumbers: true,
                      tabSize: 2,
                  }}/>
              </div>
            </form>
          </div>
          <div className='col-sm-3'>
            <h2>预览</h2>
            {preview}
          </div>
        </div>

        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
        />
      </div>;
    }

    return (
      <div> 
        {navbar}
        {body}
      </div>
    );
  }
}

export default FormEditor;
