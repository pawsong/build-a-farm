import React from 'react';

const styles = require('./Dialogue.css');

interface DialogueState {
  message: string;
}

class Dialogue extends React.Component<{}, DialogueState> {
  constructor(props) {
    super(props);
    this.state = { message: '' };
  }

  setMessage(message: string) {
    this.setState({ message });
  }

  render() {
    if (!this.state.message) return null;

    return (
      <div className={styles.root}>
        <div>{this.state.message}</div>
      </div>
    );
  }
}

export default Dialogue;
