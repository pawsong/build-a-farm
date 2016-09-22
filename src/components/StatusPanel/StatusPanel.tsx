import React from 'react';

const styles = require('./StatusPanel.css');

const itemWheatUrl = require('../../icons/wheat.png');

interface StatusPanelState {
  cropCount: number;
}

class StatusPanel extends React.Component<{}, StatusPanelState> {
  constructor(props) {
    super(props);
    this.state = {
      cropCount: 0,
    };
  }

  setCropCount(cropCount: number) {
    this.setState({ cropCount });
  }

  render() {
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
