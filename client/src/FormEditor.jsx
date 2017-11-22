import React, { Component } from "react";
import AceEditor from 'react-ace';
import Form from "react-jsonschema-form";

// AceEditor themes
import brace from 'brace';
import 'brace/mode/json';
import 'brace/theme/monokai';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

// react-toastify 似乎不兼容 react@16.
const toastStub = {
  success: (msg) => alert(msg),
  error: (msg) => alert(msg),
};

/**
 * @prop {string} fomrId
 * @prop {object} schema
 * @prop {object} uiSchema
 * @prop {object} [formData]
 * @prop {function} [onBackPressed]
 * @prop {function} [onResponsesPressed]
 * @prop {string} [backTitle] title for nav back button.
 */
class FormEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      schema: JSON.stringify(this.props.schema, null, "  "),
      uiSchema: JSON.stringify(this.props.uiSchema, null, "  ")
    };
    console.log('form schema', this.state.schema);

    this.handleSchemaChange = this.handleSchemaChange.bind(this);
    this.handleUiSchemaChange = this.handleUiSchemaChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSchemaChange(value, event) {
    this.setState({schema: value});
  }

  handleUiSchemaChange(value, event) {
    this.setState({uiSchema: value});
  }

  handleSubmit(event) {
    var data = new FormData();
    console.log('form editor state', this.state);
    data.append('schema', this.state.schema);
    data.append('uiSchema', this.state.uiSchema);
    fetch('/api/forms/' + this.props.formId, { method: 'PUT', body: data }).then(r => {
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
    var preview = null;

    try {
      var schemaObj = JSON.parse(this.state.schema);
      var uiSchemaObj = JSON.parse(this.state.uiSchema);
      preview = <Form
        schema={schemaObj}
        uiSchema={uiSchemaObj}
        formData={this.props.formData}/>;
    } catch (err) {
      preview = <div className='alert alert-danger'>error</div>;
    };

    var l = window.location;
    var viewUrl = '/forms/' + this.props.formId;

    return <div className='form-editor'>
      {/* nav bar */}
      <div className='navbar navbar-default'>
        <div className="container-fluid">
          <div className="navbar-header">
            <span className="navbar-brand">
              <a className="back glyphicon glyphicon-arrow-left" href="#" title={this.props.backTitle || "返回"}
                onClick={this.props.onBackPressed}></a>
              {this.props.schema.title || '未命名表单'}
            </span>
          </div>
          <div className="navbar-right">
            <button type="button" className="btn btn-success navbar-btn" onClick={this.handleSubmit}>保存</button>
            &nbsp;
            <a href={viewUrl} target='_blank' className="btn btn-default navbar-btn">使用表单</a>
            &nbsp;
            <button type="button" className="btn btn-default navbar-btn" onClick={this.props.onResponsesPressed}>查看数据</button>
          </div>
        </div>
      </div>

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
                value={this.state.schema}
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
                value={this.state.uiSchema}
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

      <p> ToastContainer </p>
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
}

export default FormEditor;
