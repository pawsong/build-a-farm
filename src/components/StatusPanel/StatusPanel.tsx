import React from 'react';

const styles = require('./StatusPanel.css');

const itemWheatUrl = require('../../icons/wheat.png');

interface StatusPanelState {
  open?: boolean;
  cropCount?: number;
}

class StatusPanel extends React.Component<{}, StatusPanelState> {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      cropCount: 0,
    };
  }

  setCropCount(cropCount: number) {
    this.setState({ cropCount });
  }

  show() {
    this.setState({ open: true });
  }

  hide() {
    this.setState({ open: false });
  }

  render() {
    if (!this.state.open) return null;

    return (
      <div className={styles.root}>
        <img src={itemWheatUrl} />
        <div className={styles.x}>x</div>
        <div>{this.state.cropCount}</div>
      </div>
    );
  }
}

export default StatusPanel;
