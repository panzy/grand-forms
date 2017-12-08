import React  from 'react';
import { Nav, Navbar, NavDropdown } from 'react-bootstrap';

/**
 * @prop {string} [title] brand text，缺省为应用程序的名称。
 * @prop {string} [subTitle]
 * @prop {string} [backUrl] 若非空，则显示后退按钮。
 * @prop {string} [backTitle] 后退按钮的 title 属性。
 * @prop {Array<NavItem|NavDropdown>} [links] 将靠左摆放。
 * @prop {Array<NavItem>} [options] 将靠右摆放。
 * @prop {Array<MenuItem>} [moreOptions] 将放进最右边的标题为“更多操作”的 NavDropdown 里。
 */
function MyNavbar(props) {
  return (
    <Navbar collapseOnSelect>
      <Navbar.Header>
        <Navbar.Brand>
          <a href={props.backUrl} title={props.backTitle}>{props.title || 'Grand Forms'}</a>
        </Navbar.Brand>
        <Navbar.Toggle />
      </Navbar.Header>
      <Navbar.Collapse>
        <Nav>
          {props.links}
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
