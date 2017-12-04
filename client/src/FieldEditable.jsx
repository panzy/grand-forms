import React, { Component } from "react";
import Form from "react-jsonschema-form";

/**
 * @prop {string} id 用于帮助 onChange 回调定位被修改的字段（尤其当 name
 * 已改变时）。
 * @prop {string} name field name，允许修改
 * @prop {object} schema field schema
 * @prop {string} schema.title field title
 * @prop {string} schema.type data type, e.g., "string", "number".
 * @prop {string} [schema.format] string format, e.g., "email", "data-url",
 * "date".
 * @prop {string} [schema.default] default value.
 * @prop {function} onChange 回调，参数为 (id, name, schema)。
 * @prop {bool} initialEditing 初始化为编辑模式还是预览模式？
 */
class FieldEditable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      schema: props.schema
    };
    this.onChange = this.onChange.bind(this);
    this.onFormBlur = this.onFormBlur.bind(this);
  }

  onChange(form) {
    if (this.props.onChange) {
      this.setState({schema: form.formData});
    }
  }

  onFormBlur() {
    if (this.props.onChange && this.state.schema) {
      console.log('onFormBlur', this.props.id, this.state.schema.name, this.state.schema);
      this.props.onChange(this.props.id, this.state.schema.name, this.state.schema);
    }
  }

  render() {
    var {name} = this.props;
    var schema = this.state.schema;

    if (this.props.initialEditing) {
      var fieldEditableSchema = {
        type: 'object',
        properties: {
          name: {
            title: '名称',
            type: 'string',
            default: schema.name || name,
          },
          title: {
            title: '标题',
            type: 'string',
            default: schema.title
          },
          type: {
            title: '类型',
            type: 'string',
            default: schema.type,
            enum: [ 'string', 'number', 'boolean' ],
            enumNames: [ '字符串', '数值', '布尔值' ]
          }
        },
      };

      return <Form schema={fieldEditableSchema}
        children={<span/>/* no default submit buttons */}
        className='field-editable editing'
        onChange={this.onChange}
        onBlur={this.onFormBlur}
      />;
    } else {
      return <Form schema={schema}
        children={<span/>/* no default submit buttons */}
      />;
    }
  }
}

export default FieldEditable;

