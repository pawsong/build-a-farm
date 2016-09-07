import React from 'react';
import { findDOMNode } from 'react-dom';

import CodeEditor from '../CodeEditor';
import main from '../../game/main';

const styles = require('./Root.css');

class Root extends React.Component<{}, {}> {
  componentDidMount() {
    const container = findDOMNode<HTMLElement>(this.refs['game']);
    const codeEditor = this.refs['codeEditor'] as CodeEditor;

    main({
      container,
      codeEditor,
    });
  }

  render() {
    return (
      <div>
        <div className={styles.game} ref="game" tabIndex="1"></div>
        <CodeEditor ref="codeEditor" />
      </div>
    );
  }
}

export default Root;
