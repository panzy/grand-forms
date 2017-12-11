import React, { Component } from "react";
import AceEditor from 'react-ace';
import Form from "react-jsonschema-form";

import { Alert, MenuItem, NavItem } from 'react-bootstrap';

// tabs
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

// AceEditor themes
import 'brace';
import 'brace/mode/json';
import 'brace/theme/monokai';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import ErrorBoundary from './ErrorBoundary';
import FormDestination from './FormDestination';
import FormEditable from './FormEditable';
import Navbar from './Navbar';


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
      contentVersion: 0, // +1 every time a change is made
      lastErrMsg: null,
      loading: LOADING,
      schema: null, // object
      uiSchema: null, // object
      schemaJson: null, // JSON
      uiSchemaJson: null, // JSON
      formData: null,
      destination: {}, // object, will be passed to FormDestination, so must not be null.
    };

    this.handleSchemaChange = this.handleSchemaChange.bind(this);
    this.handleUiSchemaChange = this.handleUiSchemaChange.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onFormEditableChange = this.onFormEditableChange.bind(this);
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
              destination: form.destination || {type: 'default'},
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
    var lastErrMsg = null;
    try {
      schema = JSON.parse(value);
    } catch(err) {
      lastErrMsg = err.message;
    }
    this.setState({schema, schemaJson: value, lastErrMsg, contentVersion: this.state.contentVersion + 1});
  }

  handleUiSchemaChange(value, event) {
    var uiSchema = this.state.uiSchema;
    try {
      uiSchema = JSON.parse(value);
    } catch(err) {
    }
    this.setState({uiSchema, uiSchemaJson: value, contentVersion: this.state.contentVersion + 1});
  }

  handleDelete() {
    fetch('/api/forms/' + this.props.id, { method: 'DELETE' }).then(r => {
      if (r.ok) {
        toast.success('表单已删除');
      } else {
        toast.error('删除失败： ' + r.status + ' ' + r.statusText);
        r.text().then(text => console.error(text));
      }
    });
  }

  handleSubmit(event) {
    var body = {
      'schema': this.state.schema || {},
      'uiSchema': this.state.uiSchema || {},
      'destination': this.state.destination || null,
    };
    var headers = new Headers({
      "Content-Type": "application/json",
    });
    fetch('/api/forms/' + this.props.id, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body, null, '  ')
    }).then(r => {
      if (r.ok) {
        toast.success('已保存');
      } else {
        toast.error('保存失败： ' + r.status + ' ' + r.statusText);
        r.text().then(text => console.error(text));
      }
    });
    event.preventDefault();
  }

  onFormEditableChange(schema, uiSchema) {
    console.log('onFormEditableChange', schema, uiSchema);

    this.setState({
      schema,
      schemaJson: JSON.stringify(schema, null, "  "),
      uiSchema,
      uiSchemaJson: JSON.stringify(uiSchema, null, "  "),
      contentVersion: this.state.contentVersion + 1
    });
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
          backTitle='返回所有表单'
          actions={[
            <NavItem key='save' onClick={this.handleSubmit}>保存</NavItem>,
          ]}
          moreActions={[
            <MenuItem key='view' href={viewUrl} target='_blank'>使用表单</MenuItem>,
            <MenuItem key='resp' href={respUrl} target='_blank'>查看数据</MenuItem>,
            <MenuItem key='div' divider />,
            <MenuItem key='delete' onClick={this.handleDelete}>删除表单</MenuItem>,
          ]}
        />
      );

      // 由于预览是实时渲染的，难免遇到非法的schema（尽管它是合法的JSON）。
      // 例如，假设用户希望键入
      //    "format": "date"
      // 那么当他已经键入
      //    "format": "d"
      // 时，Form 渲染会抛出如下错误：
      //    Error: No widget "d" for type "string"
      // 所以需要用 ErrorBoundary 捕捉这类错误。
      //
      // 另外为了帮助 ErrorBoudary 从之前的错误中恢复，我们传个 contentVersion
      // 参数。
      var preview = this.state.lastErrMsg ?
        <Alert bsStyle='danger'>{this.state.lastErrMsg}</Alert> :
        <ErrorBoundary contentVersion={this.state.contentVersion}>
          <Form
            schema={this.state.schema || {}}
            uiSchema={this.state.uiSchema || {}}
            formData={this.state.formData}
            children={<span/>/* no default submit buttons */}
          />
        </ErrorBoundary>;

      var code = (
        <div>
          <div className='col-sm-9'>
            <form onSubmit={this.handleSubmit}>
              <div className='col-sm-7'>
                <div className='form-editor-module-title'>Schema</div>
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

                <div className='form-editor-module-title'>UI Schema</div>
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
          <div className='col-sm-3 form-preview'>
            <div className='form-editor-module-title'>预览</div>
            {preview}
          </div>
        </div>
      );

      body = (
        <div className='form-editor'>
          <Tabs>
            <TabList>
              <Tab>设计表单</Tab>
              <Tab>代码</Tab>
              <Tab>数据去向</Tab>
            </TabList>

            <TabPanel>
              <div className='container'>
                <div className='center-block form-editable'>
                  <FormEditable
                    schema={this.state.schema || {}}
                    uiSchema={this.state.uiSchema || {}}
                    formData={this.state.formData}
                    onChange={this.onFormEditableChange}
                  />
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              {code}
            </TabPanel>
            <TabPanel>
              <div className='container'>
                <FormDestination data={this.state.destination}/>
              </div>
            </TabPanel>
          </Tabs>
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

    return (
      <div> 
        {navbar}
        {body}
      </div>
    );
  }
}

export default FormEditor;
