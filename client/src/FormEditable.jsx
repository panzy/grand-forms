import React, { Component } from "react";
import Form from "react-jsonschema-form";

import FieldEditable from './FieldEditable';
import TextEditable from './TextEditable';

/**
 * @prop {object} schema
 * @prop {object} [uiSchema]
 * @prop {function} [onChange]
 */
class FormEditable extends Component {

  constructor(props) {
    super(props);

    var schema = props.schema;

    this.state = {
      fields: [],
      selectedFieldIndex: -1,
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
    this.setState({fields, selectedFieldIndex: fields.length - 1});

    if (this.props.onChange) {
      this.props.onChange(this.buildSchema());
    }
  }

  /**
   * convert fields array to schema object
   */
  buildSchema() {
    var s = {};
    Object.assign(s, this.props.schema);
    s.properties = {};
    this.state.fields.filter(f => !f._deleted).forEach(f => {
      s.properties[f.name] = f;
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
      this.setState({fields});
      if (this.props.onChange) {
        this.props.onChange(this.buildSchema());
      }
    };
  }

  onFieldChange(index, name, schema) {
    console.log('onFieldChange', index, name, schema);
    var fields = this.state.fields;
    fields[index] = schema;
    fields[index].name = name;
    this.setState({fields});
    if (this.props.onChange) {
      this.props.onChange(this.buildSchema());
    }
  }

  render() {
    var {schema, uiSchema} = this.props;

    // 不要用 field name 作为 FieldEditable.key，以免 FieldEditable 在修改 name
    // 时自身的 key 一直在变化，那会导致 DOM
    // 节点一直被替换，以致无法继续保持焦点。
    var fields = this.state.fields.map((a, idx) => {
      if (a._deleted) return null;
      var editing = this.state.selectedFieldIndex === idx;
      var field = <FieldEditable key={idx} id={idx} name={a.name} schema={a}
        initialEditing={editing}
        onChange={this.onFieldChange}/>;
      if (editing) {
        return <div key={idx}>
          <div className='field-header'>
            <a href='#' onClick={this.clearSelection}>退出修改</a>
          </div>
          {field}
        </div>;
      } else {
        return <div key={idx}>
          <div className='field-header'>
            <a href='#' onClick={this.selectField(idx).bind(this)}>修改</a>
            &nbsp;|&nbsp;
            <a href='#' onClick={this.deleteField(idx).bind(this)}>删除</a>
          </div>
          {field}
        </div>;
      }
    }).filter(c => c !== null);
    return <div>
      <h2><TextEditable value={schema.title || '无标题'}/></h2>
      {fields}
      <div> <a href='#' onClick={this.addField}>添加</a> </div>
    </div>;
  }

  selectField(idx) {
    return () => {
      this.setState({selectedFieldIndex: idx});
    };
  }
}

export default FormEditable;
