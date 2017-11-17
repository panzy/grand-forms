import React, { Component } from "react";
import AceEditor from 'react-ace';
import Form from "react-jsonschema-form";

// AceEditor themes
import brace from 'brace';
import 'brace/mode/json';
import 'brace/theme/monokai';

import { ToastContainer, toast } from 'react-toastify';

class FormEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      schema: JSON.stringify(this.props.schema, null, "  "),
      uiSchema: JSON.stringify(this.props.uiSchema, null, "  ")
    };

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
    fetch(window.location.href, { method: 'POST', body: data }).then(r => {
      if (r.ok) {
        toast.success('已保存');
      } else {
        toast.error('保存失败： ' + r.status + ' ' + r.statusText);
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
        uiSchema={uiSchemaObj}/>;
    } catch (err) {
      preview = <div className='alert alert-danger'>error</div>;
    };

    var l = window.location;
    var previewUrl = l.protocol + '//' + l.host + l.pathname.replace(/\/edit$/, '/view') + l.search;

    return <div className='form-editor'>
      {/* nav bar */}
      <div className='navbar navbar-default'>
        <div className="container-fluid">
          <div className="navbar-header">
            <span className="navbar-brand">
              <a className="back glyphicon glyphicon-arrow-left" href="/forms" title="首页"></a>
              {this.props.schema.title || '未命名表单'}
            </span>
          </div>
          <div className="navbar-right">
            <button type="button" className="btn btn-success navbar-btn" onClick={this.handleSubmit}>保存</button>
            &nbsp;
            <a href={previewUrl} target='_blank' className="btn btn-default navbar-btn">预览</a>
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

module.exports = FormEditor;
