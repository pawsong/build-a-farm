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

import VirtualMachine, { ThreadInfo } from '../../vm/VirtualMachine';
import Character from '../../game/Character';
import WorkspaceManager, { WorkspaceWrapper } from './WorkspaceManager';

interface CodeEditorProps {
  vm: VirtualMachine;
}

interface CodeEditorState {
  thread?: ThreadInfo;
  characterName?: string;
}

class CodeEditor extends React.Component<CodeEditorProps, CodeEditorState> {
  // Elements
  root: HTMLElement;
  editor: HTMLElement;
  actionButton: HTMLElement;

  // Blockly workspace
  workspaceWrapper: WorkspaceWrapper;
  workspaceManager: WorkspaceManager;

  private emitter: EventEmitter;

  constructor(props: CodeEditorProps) {
    super(props);

    this.state = {
      thread: null,
      characterName: '',
    };

    this.emitter = new EventEmitter();
  }

  private componentDidMount() {
    this.root = findDOMNode<HTMLElement>(this.refs['root']);
    this.editor = findDOMNode<HTMLElement>(this.refs['editor']);
    this.actionButton = findDOMNode<HTMLElement>(this.refs['actionButton']);

    this.root.style.display = 'none';
    this.workspaceManager = new WorkspaceManager(this.editor);
  }

  open(object: Character) {
    if (this.workspaceWrapper) return;

    // Init state
    this.setState({
      thread: this.props.vm.getThreadInfo(object.id),
      characterName: object.name,
    });
    this.root.style.display = '';

    // Mount workspace
    this.workspaceWrapper = this.workspaceManager.activateWorkspace(object.id);

    document.addEventListener('keydown', this.handleKeydown);
    this.props.vm.on('stop', this.handleProcessStop);
    window.addEventListener('resize', this.handleResize, false);
  }

  close() {
    if (!this.workspaceWrapper) return;

    // Reset state
    this.setState({
      thread: null,
      characterName: '',
    });
    this.root.style.display = 'none';

    // Unmount workspace
    this.workspaceManager.deactivateWorkspace(this.workspaceWrapper);
    this.workspaceWrapper = null;

    document.removeEventListener('keydown', this.handleKeydown);
    this.props.vm.removeListener('stop', this.handleProcessStop);
    window.removeEventListener('resize', this.handleResize, false);
  }

  setOpacity(opacity: number) {
    this.root.style.opacity = `${opacity}`;
  }

  // Events

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

  private handleProcessStop = (thread: ThreadInfo) => {
    if (this.state.thread === thread) {
      this.setState({ thread: null });
    }
  }

  private handleResize = () => {
    Blockly.svgResize(this.workspaceWrapper.workspace);
  }

  private handleCloseButtonClick = () => {
    this.emitter.emit('close');
  }

  private handleKeydown = (e: KeyboardEvent) => {
    switch(e.keyCode) {
      // ESC
      case 27: {
        this.emitter.emit('close');
        break;
      }
    }
  }

  private handleToggleScript = () => {
    if (this.state.thread) {
      this.stop();
      this.setState({ thread: null });
    } else {
      const thread = this.play();
      this.setState({ thread });
    }
  }

  private stop() {
    this.props.vm.stop(this.workspaceWrapper.objectId);
  }

  private play() {
    const { workspace, objectId } = this.workspaceWrapper;

    const dom = Blockly.Xml.workspaceToDom(workspace);
    const xml = Blockly.Xml.domToText(dom);

    const codes = [];

    for (const block of workspace.getTopBlocks()) {
      switch(block.type) {
        case 'when_run': {
          codes.push(Blockly.JavaScript.blockToCode(block));
          break;
        }
      }
    };

    const thread = this.props.vm.run(objectId, codes.join(''));
    this.emitter.emit('play');

    return thread;
  }

  render() {
    return (
      <div className={styles.root} ref="root">
        <div className={styles.menu}>
          <div>[ {this.state.characterName} ]</div>
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
          secondary={!!this.state.thread}
          ref="actionButton"
        >
          {this.state.thread ? <Stop /> : <PlayArrow />}
        </FloatingActionButton>
      </div>
    );
  }
}

interface CodeEditor {
}

export default CodeEditor;
