import React from 'react';

const styles = require('./Dialogue.css');

function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface DialogueState {
  sender: string;
  message: string;
}

class Dialogue extends React.Component<{}, DialogueState> {
  private pending: Promise<void>;

  constructor(props) {
    super(props);
    this.state = {
      sender: '',
      message: ''
    };
    this.pending = Promise.resolve();
  }

  showMessage(sender: string, message: string) {
    return this.pending = this.pending.then(() => {
      this.setState({ sender, message });
      return waitFor(2500);
    }).then(() => {
      this.setState({ sender: '', message: '' });
    });
  }

  render() {
    if (!this.state.message) return null;

    return (
      <div className={styles.root}>
        <div className={styles.sender}>{this.state.sender}:</div>
        <div className={styles.message}>{this.state.message}</div>
      </div>
    );
  }
}

export default Dialogue;
