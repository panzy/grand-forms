import React, { Component } from "react";
import Form from "react-jsonschema-form";

import { ToastContainer, toast } from 'react-toastify';

/** loading state constants. */
const LOADING = 0;
const LOADED = 1;
const LOAD_FAILED = 2;

/**
 * @prop {string} id form id
 */
class FormView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: LOADING,
      schema: null, // object
      uiSchema: null, // object
      schemaJson: null, // JSON
      uiSchemaJson: null, // JSON
    };

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
      fetch('/api/forms/' + this.props.id, { credentials: 'same-origin' }).then(r => {
        if (r.ok) {
          return r.json().then(form => {
            document.title = form.schema.title;
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

  handleSubmit(event) {
    var url = '/api/forms/' + this.props.id;
    fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(event.formData)
    }).then(r => {
      if (r.ok) {
        toast.success('已提交');
      } else {
        toast.error('提交失败： ' + r.status + ' ' + r.statusText);
        r.text().then(text => console.error(text));
      }
    });
  }

  render() {
    var body = null;

    if (this.state.loading === LOADING) {
      body = <div className='alert alert-info'>正在加载表单...</div>;
    } else if (this.state.loading === LOAD_FAILED) {
      body = <div className='alert alert-danger'>加载表单失败</div>;
    } else if (this.state.loading === LOADED) {
      body = <Form
        schema={this.state.schema || {}}
        uiSchema={this.state.uiSchema || {}}
        onSubmit={this.handleSubmit}/>;
    }

    return <div className='form-view'>
      {body}
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

export default FormView;

