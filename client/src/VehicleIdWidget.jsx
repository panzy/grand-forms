import React  from "react";
import ReactDOM  from "react-dom";
import { Overlay } from 'react-bootstrap';
import classNames from 'classnames';

/**
 * 车牌号码控件。
 *
 * 这个控件与 <input> 的关键区别在于，它获得焦点后呼出的不是 OS 的输入法，而是
 * 一个形似输入法的 Overlay。
 *
 * @prop {string} [value] initial value
 * @prop {function} [onChange] function(id:string)
 * @prop {function} [onBlur] function()
 * @prop {function} [onFocus] function()
 */
class VehicleIdWidget extends React.Component {
  /*
   * 这个组件包含两部分：
   * 1. 模拟 <input> 的 <div>
   * 2. 模拟输入法的 <MyIME>
   *
   * 对于 div，我们设置了其 tabIndex=0，因此它是有焦点的。而对于 MyIME， 它
   * 并不是真正的输入法，它本身就会吸引焦点，从而导致 div blur，所以我们不能依
   * 据 div 的焦点状态来决定 MyIME 是否显示。于是我们用 active 变量来管理它
   * 的显示状态。
   */

  constructor(props) {
    super(props);

    this.state = {
      active: false,
      value: props.value || '',
    }
  }

  componentDidMount() {
    this.domNode = ReactDOM.findDOMNode(this);
  }

  /**
   * 响应模拟 <input> 的 <div> 的 blur 事件。
   */
  onInputBlur = (ev) => {
    // 如果焦点转移到了 <MyIME> 上，则 active 应保持 true.
    if (!(ev.relatedTarget && ev.relatedTarget.attributes['rel']
      && ev.relatedTarget.attributes['rel'].value === 'ime')) {
      this.setState({active: false});
    }
  }

  /**
   * 响应模拟 <input> 的 <div> 的 click 事件。
   */
  onInputClick = () => {
    this.setState({active: true}, () => {
      if (this.props.onFocus) {
        this.props.onFocus();
      }
    });
  }

  /**
   * 响应模拟 <input> 的 <div> 的 focus 事件。
   */
  onInputFocus = () => {
    this.setState({active: true});
  }

  /**
   * 响应 <MyIME> 的 backspace 事件。
   */
  onImeBackspace = () => {
    if (this.state.value.length > 0) {
      this.setState({value: this.state.value.substr(0, this.state.value.length - 1)}, () => {
        if (this.props.onChange) {
          this.props.onChange(this.state.value);
        }
      });
    }
  }

  /**
   * 响应 <MyIME> 的 blur 事件。
   */
  onImeBlur = (ev) => {
    this.onInputBlur(ev);
  }

  /**
   * 响应 <MyIME> 的 done 事件。
   */
  onImeDone = () => {
    this.setState({active: false}, () => {
      if (this.props.onBlur) {
        this.props.onBlur();
      }
    });
  }

  /**
   * 响应 <MyIME> 的 type 事件。
   */
  onImeType = (char) => {
    this.setState({value: this.state.value + char}, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state.value);
      }
    });
  }

  render() {
    const overlayProps = {
      container: this,
      target: this.domNode,
      show: this.state.active,
      animation: false
    };

    return (
      <div id={this.props.id}>
        <div
          tabIndex={0 /* allow focus by tab */}
          className={classNames('form-control', {focus: this.state.active})}
          onClick={this.onInputClick}
          onFocus={this.onInputFocus}
          onBlur={this.onInputBlur}
        >
          {this.state.value}
        </div>

        <Overlay {...overlayProps} placement="bottom">
          <MyIME
            stage={this.state.value === '' ? 0 : 1}
            onType={this.onImeType}
            onBackspace={this.onImeBackspace}
            onDone={this.onImeDone}
            onBlur={this.onImeBlur}
          />
        </Overlay>
      </div>
    );
  }
}

/**
 * 车牌输入法。
 *
 * @prop {number} stage 0: 输入省份，1: 输入字母和数字。
 */
function MyIME({ stage, onType, onBackspace, onDone, onBlur }) {
  const chars0 = '京津渝沪冀晋辽吉黑苏\n浙皖闽赣鲁豫鄂湘粤琼\n川贵云陕甘青蒙桂宁新\n藏使领警学港澳';
  const chars1 = '1234567890ABCDEFGHJKLMNPQRSTUVWXYZ';
  const keyStyle = {
    minWidth: 'calc(10% - 4px)',
    height: '40px',
    margin: '2px',
    paddingTop: '10px',
    paddingLeft: 0,
    paddingRight: 0,
  };

  return (
    <div
      tabIndex={0}
      rel='ime'
      className='my-ime'
      style={{
        position: 'absolute',
        backgroundColor: '#EEE',
        border: '1px solid #CCC',
        height: '180px',
        left: 0,
        right: 0,
        top: 'calc(100% - 180px)',
        padding: 0
      }}
      onBlur={onBlur}
    >
      {(stage === 0 ? chars0 : chars1).split('').map((c, i) => (
        c === '\n' ?
        <br key={'br' + i}/> :
        <div key={c} rel='ime' className='btn btn-default' style={{...keyStyle}} onClick={(e) => {
          if (onType)
            onType(c);
        }}>{c}</div>))}
      <div rel='ime' className='btn btn-primary' style={{...keyStyle}} onClick={(e) => {
        if (onBackspace)
          onBackspace();
      }}>←</div>
      <div rel='ime' className='btn btn-primary' style={{...keyStyle}} onClick={(e) => {
        if (onDone)
          onDone();
      }}>完成</div>
    </div>
  );
}

export default VehicleIdWidget;
