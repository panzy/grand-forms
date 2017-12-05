import React, { Component } from "react";
import { ControlLabel } from "react-bootstrap";
import EditInPlace from './EditInPlace';
import Form from 'react-jsonschema-form';

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
      name: props.name,
      schema: props.schema
    };
  }

  onAttrChange = (value, name, extraParams) => {
    var newState = {};
    if (name === 'name') {
      // name changed
      newState = {name: value};
    } else {
      // schema changed

      var schema = this.state.schema;

      // special: convert default value of boolean from string to boolean.
      if (name === 'default' && schema.type === 'boolean')
        value = value === 'true';

      // special: convert enum from CSV to array
      if (name === 'enum') {
        if (value.trim().length === 0)
          value = undefined;
        else {
          value = value.split(',').map(s => {
            if (schema.type === 'number')
              return Number.parseFloat(s);
            else if (schema.type === 'number')
              return Number.parseInt(s);
            else
              return s.trim();
          });
        }
      }

      schema[name] = value;
      newState = {schema};
    }

    this.setState(newState, this.notifyChange);
  }

  notifyChange() {
    if (this.props.onChange) {
      this.props.onChange(this.props.id, this.state.name, this.state.schema);
    }
  }

  render() {
    var {name, schema} = this.state;

    // the input component: render as a Form without title and submit button.
    var noTitle = {};
    Object.assign(noTitle, schema);
    noTitle.title = undefined;
    var inputComp = <Form schema={noTitle}
      children={<span/>}
    />;

    var extraOptions = [];


    if (this.props.initialEditing) {
      // edit field name
      extraOptions.push(<div key='name'>
        <span className='pull-left field-attr-label'>字段名称:</span>
        <EditInPlace
          value={name}
          name='name'
          type='text'
          placeholder='字段名称'
          onChange={this.onAttrChange}
        />
      </div>);

      // edit field enums
      if (schema.type !== 'boolean') {
        extraOptions.push(<div key='enum'>
          <span className='pull-left field-attr-label'>枚举值:</span>
          <EditInPlace
            value={(schema.enum || []).join(',')}
            name='enum'
            type='text'
            placeholder='半角逗号分隔'
            onChange={this.onAttrChange}
          />
        </div>);
      }
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
          dropDownOptions={['string', 'number', 'integer', 'boolean']}
          onChange={this.onAttrChange}
        />
      </div>

      {/* the input */}
      {inputComp}

      <div className='field-editable extra-options'>
        {extraOptions}
      </div>
    </div>;
  }
}

export default FieldEditable;

