import React, { Component } from "react";

import Navbar from './Navbar';

const LOADING = 0;
const LOADED = 1;
const LOAD_FAILED = 2;

/**
 * @prop {string} id
 * @prop {string} [title]
 * @prop {string} [backTitle] title for nav back button.
 * @prop {object} items
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
      var tableHeaders = Object.entries(this.state.schema.properties).map(kv =>
        <th key={kv[0]}>{kv[1].title}</th>);
      var tableRows = this.state.items.map((row, rowId) => {
        var cells = Object.entries(this.state.schema.properties).map(kv => {
          const [key, prop] = kv; // prop key, prop description
          if (prop.type === 'boolean') {
            return <td key={key}>{row[key] ? 'y' : 'n'}</td>;
          } else if (prop.format === 'data-url') {
            if (row[key]) {
              var mediaTag = null;
              var m = row[key].match(/name=([^;]+);/);
              var filename = m ? m[1] : '';
              if (row[key].startsWith('data:image'))
                mediaTag = <img className='attachment' src={row[key]}/>;
              else if (row[key].startsWith('data:audio'))
                mediaTag = <audio className='attachment' src={row[key]} controls="controls"/>;
              else if (row[key].startsWith('data:video'))
                mediaTag = <video className='attachment' src={row[key]} controls="controls"/>;
              return <td key={key}>
                {mediaTag}
                <div>
                  <a href={row[key]} download={filename}>{'[附件] ' + filename}</a>
                </div>
              </td>;
            } else {
              return <td key={key}></td>;
            }
          } else {
            return <td key={key}>{row[key]}</td>;
          }
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
    }
    return <div className='form-responses'>
      <Navbar
        title={this.props.title || '未命名表单'}
        subTitle='采集的数据'/>
      {table}
    </div>;
  }
}

export default FormResponses;

