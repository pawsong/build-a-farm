import React from 'react';
import { findDOMNode } from 'react-dom';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import PlayArrow from 'material-ui/svg-icons/av/play-arrow';
import Stop from 'material-ui/svg-icons/av/stop';
import {
  Blockly,
  toolbox,
  initblocks,
  media,
} from '../../blockly';

const styles = require('./CodeEditor.css');

import VirtualMachine, { CompiledScript } from '../../vm/VirtualMachine';

interface CodeEditorProps {
  vm: VirtualMachine;
}

interface CodeEditorState {
  running?: boolean;
}

interface ScriptStore {
  [index: string]: string;
}

class CodeEditor extends React.Component<CodeEditorProps, CodeEditorState> {
  root: HTMLElement;
  opened: boolean;
  workspace: any;
  scripts: ScriptStore;
  objectId: string;

  constructor(props) {
    super(props);
    this.state = {
      running: false,
    };

    this.scripts = {};
  }

  private componentDidMount() {
    this.root = findDOMNode<HTMLElement>(this.refs['root']);
    window.addEventListener('resize', this.handleResize, false);
  }

  private handleResize = () => {
    if (this.workspace) Blockly.svgResize(this.workspace);
  }

  open(objectId: string) {
    if (this.opened) return;
    this.opened = true;

    const running = this.props.vm.isRunning(objectId);
    if (this.state.running !== running) this.setState({ running });

    this.objectId = objectId;

    this.root.style.display = 'block';

    if (!this.workspace) {
      this.workspace = Blockly.inject(this.root, {
        toolbox,
        media,
      });
      Blockly.JavaScript.init(this.workspace);

      const dom = Blockly.Xml.textToDom(initblocks);
      Blockly.Xml.domToWorkspace(dom, this.workspace);
    }
  }

  close() {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
  }

  setOpacity(opacity: number) {
    this.root.style.opacity = `${opacity}`;
  }

  private handleToggleScript = () => {
    if (this.state.running) {
      this.setState({ running: false });
      this.stop();
    } else {
      this.setState({ running: true });
      this.play();
    }
  }

  private play() {
    const dom = Blockly.Xml.workspaceToDom(this.workspace);
    const xml = Blockly.Xml.domToText(dom);

    const scripts: CompiledScript = {};

    for (const block of this.workspace.getTopBlocks()) {
      let event;

      switch(block.type) {
        case 'when_run': {
          event = 'when_run';
          break;
        }
      }

      if (event) {
        if (!scripts[event]) scripts[event] = [];
        const code = Blockly.JavaScript.blockToCode(block);
        const finalCode = `async () => { ${code} }`;
        scripts[event].push(finalCode);
      }
    };

    this.props.vm.execute(this.objectId, scripts);
  }

  private stop() {
    this.props.vm.stop(this.objectId);
  }

  render() {
    return (
      <div className={styles.root} ref="root">
        <FloatingActionButton
          className={styles.actionButton}
          onTouchTap={this.handleToggleScript}
          secondary={this.state.running}
        >
          {this.state.running ? <Stop /> : <PlayArrow />}
        </FloatingActionButton>
      </div>
    );
  }
}

export default CodeEditor;
