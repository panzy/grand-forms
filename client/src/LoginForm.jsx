import React  from 'react';
import {
  Button,
  ControlLabel, FormControl, FormGroup, // forms
} from 'react-bootstrap';

/**
 * A login form.
 *
 * @prop {function} onSubmit
 */
export default class LoginForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      uid: '',
      passwd: ''
    };
  }

  onChange = (event) => {
    let {name, value} = event.target;
    let s = {};
    s[name] = value;
    this.setState(s);
  }

  onSubmit = (event) => {
    let {uid, passwd} = this.state;
    this.props.onSubmit(uid, passwd);
    event.preventDefault();
  }

  render() {
    return <form onSubmit={this.onSubmit}>
      <FormGroup >
        <ControlLabel>用户名</ControlLabel>
        <FormControl
          type="text"
          name='uid'
          placeholder='用户名'
          value={this.state.uid}
          onChange={this.onChange}
        />
      </FormGroup>
      <FormGroup >
        <ControlLabel>密码</ControlLabel>
        <FormControl
          type="password"
          name='passwd'
          placeholder='密码'
          value={this.state.passwd}
          onChange={this.onChange}
        />
      </FormGroup>
      <Button type="submit" bsStyle='primary'>
        登录
      </Button>
    </form>;
  }
}

