import React  from 'react';
import {
  MenuItem, Nav, Navbar, NavDropdown, NavItem, // navbar
  OverlayTrigger, Popover, // popover
} from 'react-bootstrap';

import LoginForm from './LoginForm';

/**
 * @prop {object} [me] my profile.
 * @prop {string} me.uid
 * @prop {string} me.name
 * @prop {string} [title] brand text，缺省为应用程序的名称。
 * @prop {string} [subTitle]
 * @prop {string} [backUrl] 若非空，则显示后退按钮。
 * @prop {string} [backTitle] 后退按钮的 title 属性。
 * @prop {Array<NavItem|NavDropdown>} [links] 将靠左摆放。
 * @prop {Array<NavItem>} [options] 将靠右摆放。
 * @prop {Array<MenuItem>} [moreOptions] 将放进最右边的标题为“更多操作”的 NavDropdown 里。
 * @prop {function} [onLogin] args: (uid, passwd)
 * @prop {function} [onLogout] args: none.
 */
function MyNavbar(props) {
  const onSubmit = (uid, passwd) => {
    if (props.onLogin)
      props.onLogin(uid, passwd);
  };

  const loginPopover = (
    <Popover id="popover-trigger-click" title={null}>
      <LoginForm onSubmit={onSubmit}/>
    </Popover>
  );

  return (
    <Navbar collapseOnSelect>
      <Navbar.Header>
        <Navbar.Brand>
          <a href={props.backUrl} title={props.backTitle}>{props.title || 'Grand Forms'}</a>
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar.Header>

      {/* links & actions */}
      <Navbar.Collapse>
        <Nav>
          {props.links}
        </Nav>

        <Nav pullRight>
          {/* login & logout */
            props.me ?
            <NavDropdown
              title={(props.me.name || props.me.uid) + (props.me.group === 'admin' ? '(admin)' : '')}
              id="basic-nav-dropdown">
              <MenuItem eventKey='logout' onClick={props.onLogout}>退出</MenuItem>
            </NavDropdown> :
            <NavItem href='#'>
              <OverlayTrigger trigger="click" placement="bottom" overlay={loginPopover}>
                <span>登录</span>
              </OverlayTrigger>
            </NavItem>
          }
        </Nav>

        <Nav pullRight>
          {props.actions}
          {
            props.moreActions && props.moreActions.length > 0 ?
              <NavDropdown eventKey={3} title="更多操作" id="basic-nav-dropdown">
                {props.moreActions}
              </NavDropdown> : null
          }
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default MyNavbar;
