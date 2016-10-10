import React from 'react';
import classNames from 'classnames';
const styles = require('./Message.css');

interface MessageProps extends React.Props<Message> {
  className?: string;
  style?: React.CSSProperties;
}

class Message extends React.Component<MessageProps, {}> {
  render() {
    return (
      <div
        className={classNames(styles.root, this.props.className)}
        style={this.props.style}
      >
        {this.props.children}
      </div>
    );
  }
}

export default Message;
