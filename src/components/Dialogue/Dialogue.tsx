import React from 'react';
import { findDOMNode } from 'react-dom';

const styles = require('./Dialogue.css');

function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface DialogueState {
  sender: string;
  message: React.ReactNode;
}

class Dialogue extends React.Component<{}, DialogueState> {
  private pending: Promise<void>;
  root: HTMLElement;

  constructor(props) {
    super(props);
    this.state = {
      sender: '',
      message: '',
    };
    this.pending = Promise.resolve();
  }

  componentDidMount() {
    this.root = findDOMNode<HTMLElement>(this.refs['root']);
  }

  showMessage(sender: string, message: React.ReactNode) {
    return this.pending = this.pending.then(() => {
      this.setState({ sender, message });
      return waitFor(2500);
    }).then(() => {
      this.setState({ sender: '', message: '' });
    });
  }

  setWidth(percent: number) {
    this.root.style.width = `${percent}%`;
  }

  render() {
    return (
      <div className={styles.root} ref="root">
        {this.renderBody()}
      </div>
    );
  }

  renderBody() {
    if (!this.state.message) return null;

    return (
      <div className={styles.inner}>
        <div className={styles.sender}>{this.state.sender}:</div>
        <div className={styles.message}>{this.state.message}</div>
      </div>
    );
  }
}

export default Dialogue;
