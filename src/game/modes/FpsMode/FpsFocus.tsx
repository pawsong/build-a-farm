import React from 'react';

const styles = require('./FpsFocus.css');

interface FpsFocusState {
  visible?: boolean;
  name?: string;
}

class FpsFocus extends React.Component<{}, FpsFocusState> {
  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      name: '',
    };
  }

  setVisible(visible: boolean) {
    this.setState({ visible });
  }

  setName(name: string) {
    this.setState({ name });
  }

  render() {
    if (!this.state.visible) return null;

    return (
      <div className={styles.root}>
        <div>
          <div>Talk</div>
          <div>{this.state.name}</div>
        </div>
      </div>
    );
  }
}

export default FpsFocus;
