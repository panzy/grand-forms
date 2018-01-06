import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch
} from 'react-router-dom';
import { NavItem } from 'react-bootstrap';
import uuidv4 from 'uuid/v4';

import { ToastContainer, toast } from 'react-toastify';

import FormEditor from './FormEditor';
import FormResponses from './FormResponses';
import FormView from './FormView';
import Navbar from './Navbar';
import './App.css';

const BASENAME = '/grand-forms';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      me: undefined, // my profile
      forms: [],
      formTitle: undefined, // current form title
      formActions: [], // actions for current form
      formMoreActions: [], // more actions for current form
    };

    this.renderFormIndex = this.renderFormIndex.bind(this);
    this.renderFormEditor = this.renderFormEditor.bind(this);
    this.renderFormResponses = this.renderFormResponses.bind(this);
    this.renderFormView = this.renderFormView.bind(this);
    this.switchToFormResponsesMode = () => { this.setState({mode: 'form-resp'}); }
    this.switchToFormEditorMode = () => { this.setState({mode: 'form-editor'}); }
  }

  componentDidMount() {
    fetch(BASENAME + '/api/whoami', { credentials: 'same-origin' }).then(r => {
      if (r.ok)
        r.json().then(profile => {
          this.setState({me: profile});
        });
    });

    this.refreshForms();
  }

  onCreateForm() {
    window.location = BASENAME + '/forms/' + uuidv4() + '?new=1';
  }

  onLogin = (uid, passwd) => {
    fetch('/api/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: new Headers({'content-type': 'application/json'}),
      body: JSON.stringify({uid, passwd})
    }).then(r => {
      if (r.ok) {
        return r.json().then(data => {
          if (data.err) {
            toast.error(data.err);
          } else {
            this.setState({me: data});
            this.refreshForms();
          }
        });
      } else {
        throw new Error('HTTP ' + r.status + r.statusText);
      }
    }).catch(err => {
      toast.error(err.message);
    });
  }

  onLogout = () => {
    fetch('/api/logout', {
      method: 'POST',
      credentials: 'same-origin'
    }).then(r => {
      if (r.ok) {
        this.setState({me: undefined});
        this.refreshForms();
      } else {
        throw new Error('HTTP ' + r.status + r.statusText);
      }
    }).catch(err => {
      toast.error(err.message);
    });
  }

  refreshForms() {
    fetch(BASENAME + '/api/forms', { credentials: 'same-origin' }).then(r => {
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

  render() {
    return <div>
      <Router basename={BASENAME}>
        <Switch>
          <Route exact path="/" component={this.renderFormIndex}/>
          <Route exact path="/forms/:id" component={this.renderFormEditor}/>
          <Route path="/forms/:id/view" component={this.renderFormView}/>
          <Route path="/forms/:id/resp" component={this.renderFormResponses}/>
          <Route component={NoMatch}/>
        </Switch>
      </Router>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
      />
    </div>;
  }

  renderFormEditor({match}) {
    return <div>
      <Navbar
        title={this.state.formTitle || match.params.id}
        backTitle='返回所有表单'
        backUrl={BASENAME + '/'}
        me={this.state.me && this.state.me.uid ? this.state.me : undefined}
        actions={this.state.formActions}
        moreActions={this.state.formMoreActions}
        onLogin={this.onLogin}
        onLogout={this.onLogout}
      />
      <FormEditor id={match.params.id} customNavbar={this.onCustomFormNavbar} basename={BASENAME}/>
    </div>;
  }

  renderFormIndex() {
    return (
      <div>
        <Navbar
          me={this.state.me && this.state.me.uid ? this.state.me : undefined}
          actions={
              <NavItem href='#' onClick={this.onCreateForm}>创建表单</NavItem>
          }
          onLogin={this.onLogin}
          onLogout={this.onLogout}
        />

        <div className='container'>
          <h2>所有表单</h2>
          {this.state.forms.length && this.state.forms.length > 0 ?
            <ul className='forms'>
              {
                this.state.forms.map(f =>
                  <li key={f.id}>
                    <a className='edit' href={BASENAME + '/forms/' + f.id}>{f.title}</a>
                    {this.state.me && this.state.me.group === 'admin' ?
                      <small>&nbsp;by {f.owner || '(公共)'}</small> :
                      null
                    }
                  </li>
                )
              }
            </ul> :
            <div className='empty-form-list'>（这里是空的）</div>
          }
        </div>
      </div>
    );
  }

  renderFormResponses({match}) {
    return <FormResponses id={match.params.id} basename={BASENAME}/>;
  }

  renderFormView({match}) {
    return <FormView id={match.params.id} basename={BASENAME}/>;
  }

  onCustomFormNavbar = (formTitle, formActions, formMoreActions) => {
    this.setState({formTitle, formActions, formMoreActions});
  }
}

/**
 * No Match (404) component.
 */
const NoMatch = ({ location }) => (
  <div>
    <h3>No match for <code>{location.pathname}</code></h3>
  </div>
)

export default App;
