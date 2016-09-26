import React from 'react';
import { findDOMNode } from 'react-dom';

import Overlay from '../Overlay';
import CodeEditor from '../CodeEditor';
import StatusPanel from '../StatusPanel';
import Notification from '../Notification';
import Dialogue from '../Dialogue';
import FpsFocus from '../FpsFocus';

import main from '../../game/main';

import VirtualMachine from '../../vm/VirtualMachine';

const styles = require('./Root.css');

class Root extends React.Component<{}, {}> {
  vm: VirtualMachine;

  constructor(props) {
    super(props);
    this.vm = new VirtualMachine();
  }

  componentDidMount() {
    const container = findDOMNode<HTMLElement>(this.refs['game']);
    const overlay = this.refs['overlay'] as Overlay;
    const codeEditor = this.refs['codeEditor'] as CodeEditor;
    const statusPanel = this.refs['statusPanel'] as StatusPanel;
    const notification = this.refs['notification'] as Notification;
    const fpsFocus = this.refs['fpsFocus'] as FpsFocus;
    const dialogue = this.refs['dialogue'] as Dialogue;

    main({
      container,
      overlay,
      codeEditor,
      notification,
      statusPanel,
      fpsFocus,
      dialogue,
      vm: this.vm,
    });
  }

  render() {
    return (
      <div>
        <Overlay ref="overlay" />
        <Notification ref="notification" />
        <div className={styles.game} ref="game" tabIndex={1}></div>
        <StatusPanel ref="statusPanel" />
        <CodeEditor ref="codeEditor" vm={this.vm} />
        <Dialogue ref="dialogue" />
        <FpsFocus ref="fpsFocus" />
      </div>
    );
  }
}

export default Root;
