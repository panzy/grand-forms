import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import uuidv4 from 'uuid/v4';

import FormEditor from './FormEditor';
import FormResponses from './FormResponses';
import FormView from './FormView';
import Navbar from './Navbar';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      forms: []
    };

    this.renderFormIndex = this.renderFormIndex.bind(this);
    this.renderFormEditor = this.renderFormEditor.bind(this);
    this.renderFormResponses = this.renderFormResponses.bind(this);
    this.renderFormView = this.renderFormView.bind(this);
    this.switchToFormResponsesMode = () => { this.setState({mode: 'form-resp'}); }
    this.switchToFormEditorMode = () => { this.setState({mode: 'form-editor'}); }
  }

  componentDidMount() {
    fetch('/api/forms').then(r => {
      if (r.ok) {
        return r.json().then(forms => {
          this.setState({forms});
        });
      } else {
        return Promise.reject(new Error('加载表单列表失败：HTTP ' + r.status + ' ' + r.statusText));
      }
    }).catch(err => {
      alert(err.message);
    });
  }

  onCreateForm() {
    window.location = '/forms/' + uuidv4() + '?new=1';
  }

  render() {
    return <Router>
      <div>
        <Route exact path="/" component={this.renderFormIndex}/>
        <Route exact path="/forms/:id" component={this.renderFormEditor}/>
        <Route path="/forms/:id/view" component={this.renderFormView}/>
        <Route path="/forms/:id/resp" component={this.renderFormResponses}/>
      </div>
    </Router>
  }

  renderFormEditor({match}) {
    return <FormEditor id={match.params.id}/>;
  }

  renderFormIndex() {
    return (
      <div>
        <Navbar
          actions={
            <ul className='nav navbar-nav'>
              <li><a href='#' onClick={this.onCreateForm}>创建表单</a></li>
            </ul>
          }
        />

        <div className='col-sm-12'>
          <h2>所有表单</h2>
          <ul className='forms'>
            {
              this.state.forms.map(f =>
                <li key={f.id}>
                  <a className='edit' href={'/forms/' + f.id}>{f.title}</a>
                </li>
              )
            }
          </ul>
        </div>

        {/* XXX not rendered()? */}
        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
        />
      </div>
    );
  }

  renderFormResponses({match}) {
    return <FormResponses id={match.params.id}/>;
  }

  renderFormView({match}) {
    return <FormView id={match.params.id} />;
  }
}

export default App;
