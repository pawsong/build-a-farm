import React from 'react';
import { findDOMNode } from 'react-dom';

import CodeEditor from '../CodeEditor';
import StatusPanel from '../StatusPanel';
import Notification from '../Notification';
import Dialogue from '../Dialogue';

import main from '../../game/main';

import VirtualMachine from '../../vm/VirtualMachine';

const styles = require('./Root.css');

class Root extends React.Component<{}, void> {
  vm: VirtualMachine;

  constructor(props) {
    super(props);
    this.vm = new VirtualMachine();
  }

  componentDidMount() {
    const container = findDOMNode<HTMLElement>(this.refs['game']);

    const codeEditor = this.refs['codeEditor'] as CodeEditor;
    const statusPanel = this.refs['statusPanel'] as StatusPanel;
    const notification = this.refs['notification'] as Notification;
    const dialogue = this.refs['dialogue'] as Dialogue;

    main({
      container,
      codeEditor,
      notification,
      statusPanel,
      dialogue,
      vm: this.vm,
    });
  }

  render() {
    return (
      <div>
        <div className={styles.game} ref="game" tabIndex={1}></div>
        <Notification ref="notification" />
        <StatusPanel ref="statusPanel" />
        <CodeEditor ref="codeEditor" vm={this.vm} />
        <Dialogue ref="dialogue" />
      </div>
    );
  }
}

export default Root;
