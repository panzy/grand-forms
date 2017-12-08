import React, { Component } from "react";
import { Alert, Radio } from 'react-bootstrap';
import Form from "react-jsonschema-form";


/**
 * 配置表单数据的去向。
 *
 * @prop {object} data
 * @prop {string} [data.type] one of "default", "db", "web".
 */
class FormDestination extends Component {
  constructor(props) {
    super(props);

    this.state = {};
    Object.assign(this.state, this.props.data);

    this.dbFormSchema = {
      "type": "object",
      "required": [
        "url", "table"
      ],
      "properties": {
        "url": {
          "type": "string",
          "title": "连接字符串",
          "default": "jdbc:mysql://localhost/grandforms?characterEncoding=utf8&user=root"
        },
        "table": {
          "type": "string",
          "title": "表名称",
          "default": ""
        }
      }
    };

    this.webFormSchema = {
      "type": "object",
      "required": [
        "url"
      ],
      "properties": {
        "url": {
          "type": "string",
          "title": "URL",
          "default": "http://192.168.1.90/api/submit"
        },
        "contentType": {
          "type": "string",
          "title": "Content Type",
          "enum": [ "application/json", "application/x-www-form-urlencoded", "multipart/form-data" ],
          "default": "application/json"
        }
      }
    };

    this.updateDetailFormSchema(props);

    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.handleDetailChange = this.handleDetailChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.updateDetailFormSchema(nextProps);
  }

  handleTypeChange(event) {
    var type = event.target.value;
    this.setState({type});

    // output to this.props.data
    Object.keys(this.props.data).forEach(k => delete this.props.data[k]);
    this.props.data.type = type;
    if (this[type + 'FormSchema']) {
      Object.entries(this[type + 'FormSchema'].properties).forEach(arr => {
        this.props.data[arr[0]] = arr[1].default;
      });
    }
    console.debug('destination type changed', this.props.data);
  }

  handleDetailChange(arg) {
    // TODO validation
    var formData = arg.formData;
    // output to this.props.data
    Object.assign(this.props.data, formData);
    console.debug('destination detail changed', this.props.data);
  }

  render() {
    var detail = null;

    var type = (this.state && this.state.type) || 'default';

    if (type === 'db') {
      detail = (
        <div className='form-destination-detail'>
          <Form
            schema={this.dbFormSchema}
            formData={null}
            onChange={this.handleDetailChange}
            children={<span/>/* no default submit buttons */}
          />
        </div>
      );
    } else if (type === 'web') {
      detail = (
        <div className='form-destination-detail'>
          <Form
            schema={this.webFormSchema}
            formData={null}
            onChange={this.handleDetailChange}
            children={<span/>/* no default submit buttons */}
          />
        </div>
      );
    } else {
      detail = <div className='form-destination-detail'>
        <Alert>无需进一步配置</Alert>
      </div>;
    }

    return (
      <div>
        <div className='col-sm-3'>
          <h2>类型</h2>
          <form>
            <Radio name='type' value='default' checked={'default' === type} onChange={this.handleTypeChange}>Grand Forms 服务器</Radio>
            <Radio name='type' value='db' checked={'db' === type} onChange={this.handleTypeChange}>数据库</Radio>
            <Radio name='type' value='web' checked={'web' === type} onChange={this.handleTypeChange}>Web 接口</Radio>
          </form>
        </div>
        <div className='col-sm-9'>
          <h2>详情</h2>
          {detail}
        </div>
      </div>
    );
  }

  /**
   * 依据 props 更新数据去向详情配置表单的 schema。
   */
  updateDetailFormSchema(props) {
    var type = this.state.type;
    var fields = [];
    if (type === 'db') {
      fields = ['url', 'table'];
    } else if (this.state.type === 'web') {
      fields = ['url'];
    }
    fields.forEach(name => this[type + 'FormSchema'].properties[name].default = props.data[name]);
  }
}

export default FormDestination;
