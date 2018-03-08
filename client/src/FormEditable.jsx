import React, { Component } from "react";
import classNames from 'classnames';

import EditInPlace from './EditInPlace';
import FieldEditable from './FieldEditable';

/**
 * @prop {object} schema
 * @prop {object} [uiSchema]
 * @prop {function} [onChange] (schema, uiSchema)
 */
class FormEditable extends Component {

  constructor(props) {
    super(props);

    var {schema, uiSchema} = props;

    this.state = {
      fields: [], // from schema.properties. convert object to array for convenience of manipulating fields.
      selectedFieldIndex: -1,
      title: schema.title || '未命名表单',
      uiSchema: uiSchema || {},
    };

    if (schema && schema.type === 'object') {
      this.state.fields = Object.entries(schema.properties).map(arr => {
        var o = {};
        o.name = arr[0];
        Object.assign(o, arr[1]);
        return o;
      });
    }

    this.addField = this.addField.bind(this);
    this.clearSelection = this.clearSelection.bind(this);
    this.onFieldChange = this.onFieldChange.bind(this);
  }

  addField() {
    var fields = this.state.fields;
    var suffix = fields.length + 1;
    var name = 'field_' + suffix;
    fields.push({
      name,
      title: '新字段 ' + suffix,
      type: 'string'
    });
    this.setState({fields, selectedFieldIndex: fields.length - 1}, this.notifyChange);
  }

  /**
   * convert fields array to schema object
   */
  buildSchema() {
    var s = {
      title: this.state.title,
      type: 'object',
      properties: {},
    };

    this.state.fields.filter(f => !f._deleted).forEach(f => {
      var o = {};
      Object.assign(o, f);
      delete o.name;
      s.properties[f.name] = o;
    });
    return s;
  }

  clearSelection() {
    this.setState({selectedFieldIndex: -1});
  }

  deleteField(idx) {
    return () => {
      var fields = this.state.fields;
      // 为了保持 React key 不变，不要删除 fields 数组中的元素
      fields[idx]._deleted = true;
      this.setState({fields}, this.notifyChange);
    };
  }

  notifyChange() {
    if (this.props.onChange) {
      this.pruneUiSchema(() => {
        this.props.onChange(this.buildSchema(), this.state.uiSchema);
      });
    }
  }

  onAttrChange = (value, name, extraParams) => {
    if (name === 'title') {
      this.setState({title: value}, this.notifyChange);
    }
  }

  onEndEditing = (index) => {
    this.setState({selectedFieldIndex: -1});
  }

  onFieldChange(index, name, fieldSchema, fieldUiSchema) {
    var fields = this.state.fields;
    fields[index] = fieldSchema;
    fields[index].name = name;

    // assign field ui schema to form ui schema
    var uiSchema = this.state.uiSchema;
    if (fieldUiSchema) {
      uiSchema[name] = fieldUiSchema;
    }

    this.setState({fields, uiSchema}, this.notifyChange);
  }

  /**
   * 清理 UI schema 中的无效内容，比如已经从 JSONSchema 中删除的属性。
   *
   * 这个操作更新的是 this.state.uiSchema。
   *
   * @arg {function} callback 将传递给 this.setState().
   */
  pruneUiSchema(callback) {
    var uiSchema = {};
    Object.entries(this.state.uiSchema).forEach(arr => {
      const [name, value] = arr;
      if (Object.keys(value).length > 0
        && this.state.fields.findIndex(f => !f._deleted && f.name === name) !== -1)
        uiSchema[name] = value;
    });
    this.setState({uiSchema}, callback);
  }

  render() {
    var {uiSchema} = this.state;

    // 不要用 field name 作为 FieldEditable.key，以免 FieldEditable 在修改 name
    // 时自身的 key 一直在变化，那会导致 DOM
    // 节点一直被替换，以致无法继续保持焦点。
    var fields = this.state.fields.map((fieldSchema, idx) => {
      if (fieldSchema._deleted) return null;
      var editing = this.state.selectedFieldIndex === idx;
      var field = <div onClick={(e) => this.selectField(idx)}>
        <FieldEditable key={idx} id={idx} name={fieldSchema.name}
          schema={fieldSchema}
          uiSchema={uiSchema[fieldSchema.name]}
          initialEditing={editing}
          onChange={this.onFieldChange}
          onEndEditing={this.onEndEditing}
        />
      </div>;
      var toolbar = null;
      if (editing) {
        toolbar = <div className='field-editable-toolbar'>
          <a href='#' onClick={this.deleteField(idx).bind(this)}>删除</a>
        </div>;
      }
      return <div key={idx}
        className={classNames('field-editable', {editing})}>
        {field}
        {toolbar}
      </div>;
    }).filter(c => c !== null);
    return <div>
      <h2>
        <EditInPlace
          value={this.state.title}
          name='title'
          type='text'
          placeholder='表单标题'
          onBeginEditing={(e) => this.selectField(-1)}
          onChange={this.onAttrChange}
        />
      </h2>
      {fields}
      <div> <a href='#' onClick={this.addField}>添加</a> </div>
    </div>;
  }

  selectField = (index) => {
    this.setState({selectedFieldIndex: index});
  }
}

export default FormEditable;
