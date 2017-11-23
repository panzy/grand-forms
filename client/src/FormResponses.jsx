import React, { Component } from "react";

import Navbar from './Navbar';

const LOADING = 0;
const LOADED = 1;
const LOAD_FAILED = 2;

/**
 * @prop {string} id
 */
class FormResponses extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: LOADING,
      schema: {},
      items: []
    };
  }

  componentDidMount() {
    this.setState({loading: LOADING});
    fetch('/api/forms/' + this.props.id + '/resp').then(r => {
      if (r.ok) {
        r.json().then(data => {
          data.loading = LOADED;
          this.setState(data);
        });
      } else {
        return Promise.reject(new Error('加载数据失败：HTTP ' + r.status + ' ' + r.statusText));
      }
    }).catch(err => {
      console.error(err);
      alert(err.message);
      this.setState({loading: LOAD_FAILED});
    });
  }

  render() {
    var table = null;
    if (this.state.loading === LOADING) {
      table = <div className='alert alert-info'>正在加载数据...</div>;
    } else if (this.state.loading === LOAD_FAILED) {
      table = <div className='alert alert-danger'>加载数据失败</div>;
    } else if (this.state.loading === LOADED) {
      switch (this.state.schema.type) {
        case 'object':
          var tableHeaders = Object.entries(this.state.schema.properties).map(kv =>
            <th key={kv[0]}>{kv[1].title}</th>);
          var tableRows = this.state.items.map((row, rowId) => {
            var cells = Object.entries(this.state.schema.properties).map(kv => {
              const [key, {type, format}] = kv;
              return <Cell value={row[key]} type={type} format={format}/>;
            });
            return <tr key={rowId}>{cells}</tr>;
          });
          table = <table className='table responses'>
            <thead>
              <tr>{tableHeaders}</tr>
            </thead>
            <tbody>
              {tableRows}
            </tbody>
          </table>;
          break;
        case 'string':
          var tableRows = this.state.items.map((value, rowId) => <tr key={rowId}><Cell value={value} type='string'/></tr>);
          table = <table className='table responses'>
            <thead>
              <tr><th>值</th></tr>
            </thead>
            <tbody>
              {tableRows}
            </tbody>
          </table>;
          break;
        default:
          table = <pre>{JSON.stringify(this.state.items, null, "  ")}</pre>;
          break;
      }
    }
    return <div className='form-responses'>
      <Navbar
        title={this.state.schema && this.state.schema.title ? this.state.schema.title : '未命名表单'}
        subTitle='采集的数据'/>
      {table}
    </div>;
  }
}

function Cell(props) {
  const {key, type, format, value} = props;
  if (type === 'boolean') {
    return <td key={key}>{value ? 'y' : 'n'}</td>;
  } else if (format === 'data-url') {
    if (value) {
      var mediaTag = null;
      var m = value.match(/name=([^;]+);/);
      var filename = m ? m[1] : '';
      if (value.startsWith('data:image'))
        mediaTag = <img className='attachment' src={value}/>;
      else if (value.startsWith('data:audio'))
        mediaTag = <audio className='attachment' src={value} controls="controls"/>;
      else if (value.startsWith('data:video'))
        mediaTag = <video className='attachment' src={value} controls="controls"/>;
      return <td key={key}>
        {mediaTag}
        <div>
          <a href={value} download={filename}>{'[附件] ' + filename}</a>
        </div>
      </td>;
    } else {
      return <td key={key}></td>;
    }
  } else {
    return <td key={key}>{value}</td>;
  }
}

export default FormResponses;

