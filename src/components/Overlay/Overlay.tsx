import React from 'react';
import classNames from 'classnames';

const styles = require('./Overlay.css');

interface OverlayState {
  show: boolean;
}

class Overlay extends React.Component<{}, OverlayState> {
  constructor(props) {
    super(props);
    this.state = {
      show: true,
    };
  }

  hide() {
    this.setState({ show: false });
  }

  render() {
    if (!this.state.show) return null;

    return (
      <div className={styles.root}>
        <div className={styles.bg}></div>
        <div className={styles['sk-folding-cube']}>
          <div className={classNames(styles['sk-cube1'], styles['sk-cube'])}></div>
          <div className={classNames(styles['sk-cube2'], styles['sk-cube'])}></div>
          <div className={classNames(styles['sk-cube4'], styles['sk-cube'])}></div>
          <div className={classNames(styles['sk-cube3'], styles['sk-cube'])}></div>
        </div>
      </div>
    );
  }
}

export default Overlay;
