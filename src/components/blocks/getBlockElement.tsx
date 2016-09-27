import React from 'react';

import {
  Blockly,
  media,
} from '../../blockly';

const styles = require('./getBlockElement.css');

const container = document.createElement('div');
container.classList.add(styles.container);
document.body.appendChild(container);

const workspace = Blockly.inject(container, { media });
const XMLS = new XMLSerializer();

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

export default function getBlockImage(xml: string) {
  const dom = Blockly.Xml.textToDom(xml);
  Blockly.Xml.domToWorkspace(dom, workspace);

  let minWidth = Infinity;
  let minHeight = Infinity;

  const blocks = workspace.getTopBlocks();
  for (const block of blocks) {
    const group = block.getSvgRoot();

    // Cancel translation
    group.removeAttribute('transform');

    const { width, height } = block.getHeightWidth();

    minWidth = Math.min(minWidth, width);
    minHeight = Math.min(minHeight, height);
  }

  const containerWidth = container.style.width = `${Math.ceil(minWidth)}px`;
  const containerHeight = container.style.height = `${Math.ceil(minHeight)}px`;

  Blockly.svgResize(workspace);

  const svg = workspace.getParentSvg();
  const data = XMLS.serializeToString(svg);

  workspace.clear();

  return (
    <div
      className={styles.container}
      dangerouslySetInnerHTML={{ __html: data }}>
    </div>
  );
}
