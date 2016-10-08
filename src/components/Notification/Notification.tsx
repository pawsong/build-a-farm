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

  private async runThread() {
    if (this.threadIsRunning) return;

    const query = this.queue.shift();
    if (!query) return;

    this.threadIsRunning = true;
    await this.processQuery(query);
    this.threadIsRunning = false;

    this.runThread();
  }

  private async processQuery(query: NotificationQuery) {
    this.setState({ query, animation: styles.slideInDown });
    await waitFor(3000);
    this.setState({ animation: styles.slideOutUp });
    await waitFor(500);
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
