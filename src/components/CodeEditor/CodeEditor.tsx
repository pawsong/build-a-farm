import React from 'react';
import { findDOMNode } from 'react-dom';
import { Blockly, toolbox } from '../../blockly';

const styles = require('./CodeEditor.css');

class CodeEditor extends React.Component<{}, {}> {
  root: HTMLElement;
  opened: boolean;
  workspace: any;

  private componentDidMount() {
    this.root = findDOMNode<HTMLElement>(this.refs['root']);
    window.addEventListener('resize', this.handleResize, false);
  }

  private handleResize = () => {

  }

  open() {
    if (this.opened) return;
    this.opened = true;

    this.root.style.display = 'block';
    this.workspace = Blockly.inject(this.root, { toolbox });
  }

  close() {

  }

  setOpacity(opacity: number) {
    this.root.style.opacity = `${opacity}`;
  }

  render() {
    return (
      <div className={styles.root} ref="root">
      </div>
    );
  }
}

export default CodeEditor;


// class Editor {
//   root: HTMLElement;
//   opened: boolean;
//   workspace: any;

//   constructor() {
//     this.root = document.createElement('div');
//     this.root.style.position = 'absolute';
//     this.root.style.top = '10px';
//     this.root.style.right = '10px';
//     this.root.style.bottom = '10px';
//     this.root.style.left = '50%';
//     this.root.style.zIndex = '1';
//     this.root.style.display = 'none';

//     document.body.appendChild(this.root);

//     this.opened = false;

//     window.addEventListener('resize', this.handleResize, false);
//   }

//   handleResize = () => {
//     if (!this.opened) return;
//   }

//   open() {
//     if (this.opened) return;

//     this.root.style.display = 'block';
//     this.workspace = Blockly.inject(this.root, { toolbox });
//   }

//   setOpacity(opacity: number) {
//     this.root.style.opacity = `${opacity}`;
//   }

//   close() {

//   }
// }
