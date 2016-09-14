import React from 'react';
import { findDOMNode } from 'react-dom';

import CodeEditor from '../CodeEditor';
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
    const codeEditor = this.refs['codeEditor'] as CodeEditor;

    main({
      container,
      codeEditor,
      vm: this.vm,
    });
  }

  render() {
    return (
      <div>
        <div className={styles.game} ref="game" tabIndex="1"></div>
        <CodeEditor ref="codeEditor" vm={this.vm} />
      </div>
    );
  }
}

export default Root;
