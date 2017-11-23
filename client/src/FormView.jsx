import React, { Component } from "react";
import AceEditor from 'react-ace';
import Form from "react-jsonschema-form";

// AceEditor themes
import brace from 'brace';
import 'brace/mode/json';
import 'brace/theme/monokai';

import { ToastContainer, toast } from 'react-toastify';

/**
 * @prop {string} id form id
 * @prop {object} schema
 * @prop {object} uiSchema
 */
class FormView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      schema: JSON.stringify(this.props.schema, null, "  "),
      uiSchema: JSON.stringify(this.props.uiSchema, null, "  ")
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    var url = '/api/forms/' + this.props.id;
    fetch(url, {
      method: 'POST',
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
    var form = null;

    try {
      var schemaObj = JSON.parse(this.state.schema);
      var uiSchemaObj = JSON.parse(this.state.uiSchema);
      form = <Form
        schema={schemaObj}
        uiSchema={uiSchemaObj}
        onSubmit={this.handleSubmit}/>;
    } catch (err) {
      form = <div className='alert alert-danger'>{err.message}</div>;
    };

    var l = window.location;
    var editUrl = l.protocol + '//' + l.host + l.pathname.replace(/\/view/, '/edit') + l.search;

    return <div className='form-view'>

      {form}

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

