import React, { Component } from 'react';

/**
 * @prop {string} [title] brand text，缺省为应用程序的名称。
 * @prop {string} [subTitle]
 * @prop {string} [backUrl] 若非空，则显示后退按钮。
 * @prop {string} [backTitle] 后退按钮的 title 属性。
 * @prop {Component|Array<Component>} [actions] 比如一些 buttons。
 */
function Navbar(props) {
  var logo, actions;
  if (props.backUrl) {
    logo = <a className="back glyphicon glyphicon-arrow-left" href={props.backUrl} title={props.backTitle || '返回'}/>;
  } else {
    logo = <img alt='logo' src='/favicon.ico'/>;
  }

  if (Array.isArray(props.actions))
    actions = props.actions.map((a, idx) => <li key={idx}>{a}</li>);
  else if (props.actions)
    actions = <li>{props.actions}</li>;
  else
    actions = null;

  return (
    <div className='navbar navbar-default'>
      <div className="container-fluid">
        <div className="navbar-header">
          <span className="navbar-brand">
            {logo}
            {props.title || 'Grand Forms'}
            {props.subTitle ? <small>&nbsp;{props.subTitle}</small> : null}
          </span>
        </div>
        <div className="navbar-right">
          <ul className='nav navbar-nav'> {actions} </ul>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
