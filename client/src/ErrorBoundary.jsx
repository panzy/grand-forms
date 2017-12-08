import React, { Component } from "react";
import { Alert } from 'react-bootstrap';

/**
 * ErrorBoundary
 *
 * @prop {string|number} contentVersion 发生变化时将清除之前的错误信息。
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({ hasError: true, message: error.message });
    // You can also log the error to an error reporting service
    console.error(error, info);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.contentVersion !== this.props.contentVersion) {
      //console.log('ErrorBoundary contentVersion changed:', prevProps.contentVersion, '=>', this.props.contentVersion);
      if (this.state.hasError) {
        //console.log('ErrorBoundary reset error');
        this.setState({hasError: false, message: null});
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <Alert bsStyle='danger'>{this.state.message || 'Something went wrong.'}</Alert>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
