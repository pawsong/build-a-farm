import {
  Blockly,
  toolbox,
  initblocks,
  media,
} from '../../blockly';

const blocklyRoot = document.createElement('div');
document.body.appendChild(blocklyRoot);
blocklyRoot.style.visibility = 'hidden';

const container = document.createElement('div');
blocklyRoot.appendChild(container);

const defaultWorkspace = Blockly.inject(container, { readOnly: true });
setTimeout(() => blocklyRoot.removeChild(container), 0);

export interface WorkspaceWrapper {
  container: HTMLElement;
  workspace: any;
  objectId: string;
}

function createWorkspace(objectId: string, xml: string): WorkspaceWrapper {
  const mainWorkspace = Blockly.mainWorkspace;

  function resetMarkedWorkspace() {
    if (mainWorkspace !== Blockly.mainWorkspace) {
      mainWorkspace.markFocused();
    }
  }

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.height = '100%';
  container.style.width = '100%';

  let workspace: any;

  try {
    blocklyRoot.appendChild(container);

    workspace = Blockly.inject(container, {
      toolbox,
      media,
      // grid: {
      //   spacing: 20,
      //   length: 3,
      //   colour: '#ccc',
      // },
      // trashcan: true,
      // scrollbars: true,
    });

    const dom = Blockly.Xml.textToDom(xml);
    Blockly.Xml.domToWorkspace(dom, workspace);
  } catch(error) {
    resetMarkedWorkspace();

    if (typeof error !== 'string') throw error;

    // Blockly throws string :(
    throw new Error(error);
  }

  resetMarkedWorkspace();

  // Blockly requires parent element until next frame.
  // If parent element is disconnected in this frame,
  // block element will be set to a weird position.
  setTimeout(() => {
    if (container.parentElement === blocklyRoot) {
      blocklyRoot.removeChild(container);
    }
  }, 0);

  return { container, workspace, objectId };
};

class WorkspaceManager {
  workspaces: Map<string, WorkspaceWrapper>;
  root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    this.workspaces = new Map();
  }

  activateWorkspace(objectId: string) {
    const wrapper = this.ensureWorkspace(objectId);

    this.root.appendChild(wrapper.container);
    Blockly.svgResize(wrapper.workspace);
    Blockly.JavaScript.init(wrapper.workspace);
    wrapper.workspace.markFocused();

    return wrapper;
  }

  deactivateWorkspace(wrapper: WorkspaceWrapper) {
    wrapper.container.parentElement.removeChild(wrapper.container);
    defaultWorkspace.markFocused();
  }

  private ensureWorkspace(objectId: string): WorkspaceWrapper {
    let wrapper = this.workspaces.get(objectId);
    if (wrapper) return wrapper;

    wrapper = createWorkspace(objectId, initblocks);
    this.workspaces.set(objectId, wrapper);
    return wrapper;
  }
}

export default WorkspaceManager;
