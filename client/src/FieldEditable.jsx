import React, { Component } from "react";
import { ControlLabel } from "react-bootstrap";
import Form from "react-jsonschema-form";
import EditInPlace from './EditInPlace';

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
      editing: this.props.initialEditing,
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

  onEndEditing = () => {
    this.setState({editing: false});
    if (this.props.onEndEditing)
      this.props.onEndEditing(this.props.id);
  }

  onFormBlur() {
    if (this.props.onChange && this.state.schema) {
      console.log('onFormBlur', this.props.id, this.state.schema.name, this.state.schema);
      this.props.onChange(this.props.id, this.state.schema.name, this.state.schema);
    }
  }

  onAttrChange = (value, name, extraParams) => {
    var schema = this.state.schema;

    // special: convert default value of boolean from string to boolean.
    if (name === 'default' && schema.type === 'boolean')
      value = value === 'true';

    schema[name] = value;
    this.setState({schema});
    this.notifyChange();
  }

  notifyChange() {
    if (this.props.onChange) {
      this.props.onChange(this.props.id, this.state.schema.name, this.state.schema);
    }
  }

  render() {
    var {name} = this.props;
    var schema = this.state.schema;

    var inputComp = null;
    if (schema.type === 'string') {
      inputComp = <EditInPlace
        value={schema.default}
        name='default'
        type='text'
        placeholder='缺省值'
        onChange={this.onAttrChange}
      />;
    } else if (schema.type === 'number') {
      inputComp = <EditInPlace
        value={schema.default}
        name='default'
        type='number'
        placeholder='缺省值'
        onChange={this.onAttrChange}
      />;
    } else if (schema.type === 'boolean') {
      inputComp = <EditInPlace
        value={(schema.default || false).toString()}
        name='default'
        type='string'
        placeholder='缺省值'
        onChange={this.onAttrChange}
      />;
    }

    return <div>
      {/* title */}
      <ControlLabel>
        <EditInPlace
          value={schema.title}
          name='title'
          type='text'
          placeholder='字段标题'
          onChange={this.onAttrChange}
        />
      </ControlLabel>
      {/* type, TODO: React Bootstrap Select */}
      <div className='pull-right'>
        <EditInPlace
          value={schema.type}
          name='type'
          type='select'
          dropDownOptions={['string', 'number', 'boolean']}
          onChange={this.onAttrChange}
        />
      </div>
      {inputComp}
    </div>;
  }
}

export default FieldEditable;

