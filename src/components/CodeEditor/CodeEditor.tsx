import React from 'react';
import { findDOMNode } from 'react-dom';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import PlayArrow from 'material-ui/svg-icons/av/play-arrow';
import Stop from 'material-ui/svg-icons/av/stop';
import { EventEmitter } from 'events';
import {
  Blockly,
  toolbox,
  initblocks,
  media,
} from '../../blockly';

const styles = require('./CodeEditor.css');

import VirtualMachine, { CompiledScript } from '../../vm/VirtualMachine';
import Character from '../../game/Character';

interface CodeEditorProps {
  vm: VirtualMachine;
}

interface CodeEditorState {
  running?: boolean;
  object?: Character;
}

interface ScriptStore {
  [index: string]: string;
}

class CodeEditor extends React.Component<CodeEditorProps, CodeEditorState> {
  root: HTMLElement;
  editor: HTMLElement;
  actionButton: HTMLElement;

  opened: boolean;
  workspace: any;
  scripts: ScriptStore;

  emitter: EventEmitter;

  constructor(props) {
    super(props);
    this.state = {
      running: false,
    };

    this.scripts = {};

    this.emitter = new EventEmitter();
  }

  private componentDidMount() {
    this.root = findDOMNode<HTMLElement>(this.refs['root']);
    this.root.style.display = 'none';

    this.editor = findDOMNode<HTMLElement>(this.refs['editor']);
    window.addEventListener('resize', this.handleResize, false);

    this.actionButton = findDOMNode<HTMLElement>(this.refs['actionButton']);
  }

  private handleResize = () => {
    if (this.workspace) Blockly.svgResize(this.workspace);
  }

  open(object: Character) {
    if (this.opened) return;
    this.opened = true;

    const running = this.props.vm.isRunning(object.id);
    if (this.state.running !== running) this.setState({ running });

    this.setState({ object });

    this.root.style.display = '';

    if (!this.workspace) {
      this.workspace = Blockly.inject(this.editor, {
        toolbox,
        media,
      });
      Blockly.JavaScript.init(this.workspace);

      const dom = Blockly.Xml.textToDom(initblocks);
      Blockly.Xml.domToWorkspace(dom, this.workspace);
    }

    document.addEventListener('keydown', this.handleKeydown);
  }

  close() {
    if (!this.opened) return;
    this.opened = false;

    this.setState({ object: null });
    this.root.style.display = 'none';

    document.removeEventListener('keydown', this.handleKeydown);
  }

  setOpacity(opacity: number) {
    this.root.style.opacity = `${opacity}`;
  }

  on(event: string, handler: Function) {
    this.emitter.on(event, handler);
    return this;
  }

  once(event: string, handler: Function) {
    this.emitter.once(event, handler);
    return this;
  }

  removeListener(event: string, handler: Function) {
    this.emitter.removeListener(event, handler);
    return this;
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

    this.props.vm.execute(this.state.object.id, scripts);

    this.emitter.emit('play');
  }

  private stop() {
    this.props.vm.stop(this.state.object.id);
  }

  handleCloseButtonClick = () => {
    this.emitter.emit('close');
  }

  handleKeydown = (e: KeyboardEvent) => {
    if (e.keyCode !== 27 /* ESC */) return;

    this.emitter.emit('close');
  }

  render() {
    return (
      <div className={styles.root} ref="root">
        <div className={styles.menu}>
          <div>[ {this.state.object && this.state.object.name} ]</div>
          <div
            className={styles.close}
            onTouchTap={this.handleCloseButtonClick}
          >
            x
          </div>
        </div>
        <div className={styles.editor} ref="editor"></div>
        <FloatingActionButton
          className={styles.actionButton}
          onTouchTap={this.handleToggleScript}
          secondary={this.state.running}
          ref="actionButton"
        >
          {this.state.running ? <Stop /> : <PlayArrow />}
        </FloatingActionButton>
      </div>
    );
  }
}

export default CodeEditor;
