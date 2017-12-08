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
 * @prop {object} [uiSchema] field ui schema
 * @prop {function} onChange 回调，参数为 (id, name, schema, uiSchema)。
 * @prop {bool} initialEditing 初始化为编辑模式还是预览模式？
 */
class FieldEditable extends Component {
  constructor(props) {
    super(props);

    const {name, schema, uiSchema} = props;

    this.state = {
      name,
      schema,
      uiSchema: uiSchema || {}, // 为了访问方便，此属性永不为 undefined.
    };

    // 字段类型枚举
    // 这个列表是面向用户而非 JSONSchema 的，所以它并不一一对应于 JSONSchema
    // 中的 type 属性，事实上它与 type, format 属性，甚至 UI schema 都有关系。
    this.types = ['string', 'number', 'integer', 'boolean', 'file', 'image', 'video'];
  }

  /**
   * 从 this.types 中找出一个适合当前 {schema, uiSchema} 的值。
   */
  getFieldType() {
    const {type, format} = this.state.schema;
    const uiOptions = this.state.uiSchema['ui:options'];
    switch (format || '') {
      case 'data-url':
        if (uiOptions && /^image\//i.test(uiOptions.accept))
          return 'image';
        if (uiOptions && /^video\//i.test(uiOptions.accept))
          return 'video';
        return 'file';
      default:
        return type;
    }
  }

  /**
   * 用 this.types 中的一个值设置 {schema, uiSchema}。
   */
  setFieldType(t) {
    var {schema, uiSchema} = this.state;

    switch (t) {
      case 'file':
        schema.type = 'string';
        schema.format = 'data-url';
        // remove uiSchema['ui:options'].accept
        if (uiSchema['ui:options']) {
          delete uiSchema['ui:options'].accept;
          if (Object.keys(uiSchema['ui:options']).length === 0)
            delete uiSchema['ui:options'];
        }
        break;
      case 'image':
      case 'video':
        schema.type = 'string';
        schema.format = 'data-url';
        if (!uiSchema['ui:options'])
          uiSchema['ui:options'] = {};
        uiSchema['ui:options'].accept = t + '/*';
        break;
      default:
        schema.type = t;
        delete schema.format;
    }
    this.setState({schema, uiSchema}, this.notifyChange);
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
              return Number.parseFloat(s) || 0;
            else if (schema.type === 'integer')
              return Number.parseInt(s, 10) || 0;
            else
              return s.trim();
          });
        }
      }

      // special: interpret user selected field type
      if (name === 'type') {
        this.setFieldType(value);
        return;
      }

      schema[name] = value;
      newState = {schema};
    }

    this.setState(newState, this.notifyChange);
  }

  notifyChange() {
    if (this.props.onChange) {
      this.props.onChange(this.props.id, this.state.name, this.state.schema, this.state.uiSchema);
    }
  }

  render() {
    var {name, schema, uiSchema} = this.state;

    // the input component: render as a Form without title and submit button.
    var noTitle = {};
    Object.assign(noTitle, schema);
    noTitle.title = undefined;
    var inputComp = <Form schema={noTitle} uiSchema={uiSchema}
      children={<span/>}
    />;

    var extraOptionsWrapper = null;
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
      if (schema.type !== 'boolean' && schema.format !== 'data-url') {
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

    if (extraOptions.length > 0) {
      extraOptionsWrapper = <div className='field-editable extra-options'>
        {extraOptions}
      </div>;
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
          value={this.getFieldType()}
          name='type'
          type='select'
          dropDownOptions={this.types}
          onChange={this.onAttrChange}
        />
      </div>

      {/* the input */}
      {inputComp}

      {extraOptionsWrapper}
    </div>;
  }
}

export default FieldEditable;

