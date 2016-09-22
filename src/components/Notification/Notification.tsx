import React from 'react';
import classNames from 'classnames';

const styles = require('./Notification.css');

interface NotificationState {
  query?: NotificationQuery;
  animation?: string;
}

interface NotificationQuery {
  imageUrl: string;
  message: string;
}

function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Notification extends React.Component<{}, NotificationState> {
  private queue: NotificationQuery[];
  private threadIsRunning: boolean;

  constructor(props) {
    super(props);

    this.queue = [];
    this.threadIsRunning = false;

    this.state = {
      query: null,
      animation: '',
    };
  }

  show(query: NotificationQuery) {
    this.queue.push(query);
    this.runThread();
  }

  private runThread() {
    if (this.threadIsRunning) return;

    const query = this.queue.shift();
    if (!query) return;

    this.threadIsRunning = true;
    return this.processQuery(query).then(() => {
      this.threadIsRunning = false;
      this.runThread();
    });
  }

  private processQuery(query: NotificationQuery) {
    return Promise.resolve()
      .then(() => {
        this.setState({
          query,
          animation: styles.slideInDown,
        });
        return waitFor(3000);
      })
      .then(() => {
        this.setState({ animation: styles.slideOutUp });
        return waitFor(500);
      });
  }

  render() {
    if (!this.state.query) return null;

    return (
      <div className={classNames(styles.root, this.state.animation)}>
        <img className={styles.icon} src={this.state.query.imageUrl} />
        <div>
          <div className={styles.title}>
            Achivement get!
          </div>
          <div className={styles.content}>
            {this.state.query.message}
          </div>
        </div>
      </div>
    );
  }
}

export default Notification;
