import React from 'react';
import classNames from 'classnames';
import Message from '../Message';
const styles = require('./Tip.css');

interface TipProps extends React.Props<Tip> {

}

interface TipState {
  message?: string;
  style?: React.CSSProperties;
}

class Tip extends React.Component<TipProps, TipState> {
  constructor(props: TipProps) {
    super(props);
    this.state = {
      message: 'good',
      style: styles.hide,
    };
  }

  componentDidMount() {
    this.test();
  }

  async test() {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });

    await new Promise(resolve => {
      setTimeout(() => {
        this.setState({
          style: styles.slideInRight,
        }, resolve);
      }, 5 * 1000);
    });

    await new Promise(resolve => {
      setTimeout(() => {
        this.setState({
          style: styles.slideOutRight,
        }, resolve);
      }, 5 * 1000);
    });
  }

  render() {
    return (
      <div className={styles.root}>
        <Message className={classNames(styles.inner, this.state.style)}>
          <div className={styles.title}>
            Let's move!
          </div>
          <div className={styles.body}>
            Press W and S to move forwards and backwards
          </div>
        </Message>
      </div>
    );
  }
}

export default Tip;
