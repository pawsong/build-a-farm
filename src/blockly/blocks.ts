import {
  cyanA700,
  blueGrey200,
  pink300,
  greenA700,
  orangeA400,
} from 'material-ui/styles/colors';

import Blockly from './Blockly';

/* Styling */

Blockly.Blocks.math.HUE = blueGrey200;
Blockly.Blocks.loops.HUE = greenA700;

/* Constants */

const DIRECTIONS = {
  'FORWARD': '[0, 0, 1]',
  'BACK': '[0, 0, -1]',
  'UP': '[0, 1, 0]',
  'DOWN': '[0, -1, 0]',
  'LEFT': '[1, 0, 0]',
  'RIGHT': '[-1, 0, 0]',
};

const Directions = {
  FORWARD: 'FORWARD',
  BACK: 'BACK',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
}

/**
 * whenRun block
 */

Blockly.Blocks['when_run'] = {
  // Block to handle event where mouse is clicked
  helpUrl: '',
  init: function () {
    this.setColour(pink300);
    this.appendDummyInput().appendField('when run');
    this.setPreviousStatement(false);
    this.setNextStatement(true);
  },
  shouldBeGrayedOut: () => false,
};

Blockly.JavaScript['when_run'] = () => '';


/**
 * move block
 */

Blockly.Blocks['move'] = {
  init: function() {
    this.setColour(cyanA700);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(false);

    this.appendDummyInput()
        .appendField('move')
        .appendField(new Blockly.FieldDropdown([
          ['forward', Directions.FORWARD],
          ['back', Directions.BACK],
          ['left', Directions.LEFT],
          ['right', Directions.RIGHT],
        ]), 'DIRECTION')

    this.appendValueInput('DISTANCE')
        .setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('by (meters)');

    this.setTooltip('move');
    // this.setHelpUrl('http://www.example.com');
  }
};

Blockly.JavaScript['move'] = block => {
  const direction = DIRECTIONS[block.getFieldValue('DIRECTION')];

  const distance: string = Blockly.JavaScript.valueToCode(block, 'DISTANCE', Blockly.JavaScript.ORDER_ADDITION);
  if (!distance) return '';

  switch (block.getFieldValue('DIRECTION')) {
    case Directions.FORWARD: {
      return `moveForward(${distance});\n`;
    }
    case Directions.BACK: {
      return `moveBack(${distance});\n`;
    }
    case Directions.LEFT: {
      return `moveLeft(${distance});\n`;
    }
    case Directions.RIGHT: {
      return `moveRight(${distance});\n`;
    }
  }

  return '';
};

/**
 * moveTo block
 */

Blockly.Blocks['moveTo'] = {
  init: function() {
    this.setColour(cyanA700);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(false);

    this.appendValueInput('POSITION')
        .appendField('move to');

    this.setTooltip('move');
  }
};

Blockly.JavaScript['moveTo'] = block => {
  const position: string = Blockly.JavaScript.valueToCode(block, 'POSITION', Blockly.JavaScript.ORDER_NONE);
  if (!position) return '';

  return `moveTo(${position});\n`;
};

/**
 * nearestVoxel block
 */
Blockly.Blocks['nearestVoxel'] = {
  init: function() {
    this.setColour(blueGrey200);
    this.setInputsInline(false);

    this.appendDummyInput()
        .appendField('nearest')
        .appendField(new Blockly.FieldDropdown([
          ['water', [6].join(',')],
          ['farmland', [7].join(',')],
          ['growing crop', [8, 9, 10, 11, 12, 13, 14].join(',')],
          ['grown crop', [15].join(',')],
        ]), 'BLOCK_TYPE')

    this.setTooltip('move');
    this.setOutput(true);
  }
};

Blockly.JavaScript['nearestVoxel'] = block => {
  const blockType = block.getFieldValue('BLOCK_TYPE');
  return [`getNearestVoxels([${blockType}])`, Blockly.JavaScript.ORDER_NONE];
};

/**
 * use block
 */
Blockly.Blocks['use'] = {
  init: function() {
    this.setColour(cyanA700);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(false);

    this.appendValueInput('POSITION')
        .appendField('use');

    this.setTooltip('use');
  }
};

Blockly.JavaScript['use'] = block => {
  const position: string = Blockly.JavaScript.valueToCode(block, 'POSITION', Blockly.JavaScript.ORDER_NONE);
  if (!position) return '';

  return `use(${position});\n`;
};

/**
 * use block
 */
Blockly.Blocks['jump'] = {
  init: function() {
    this.setColour(cyanA700);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(false);

    this.appendDummyInput().appendField('jump');

    this.setTooltip('jump');
  }
};

Blockly.JavaScript['jump'] = block => {
  return `jump();\n`;
};

Blockly.Blocks['controls_forever'] = {
  /**
   * Block for repeat forever.
   * @this Blockly.Block
   */
  init: function() {
    this.appendDummyInput()
        .appendField('forever');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(Blockly.Blocks.loops.HUE);
    this.setTooltip(Blockly.Msg.CONTROLS_REPEAT_TOOLTIP);
    this.setHelpUrl(Blockly.Msg.CONTROLS_REPEAT_HELPURL);

    this.appendStatementInput('DO')
        .appendField(Blockly.Msg.CONTROLS_REPEAT_INPUT_DO);
  }
};

Blockly.JavaScript['controls_forever'] = function(block) {
  let branch = Blockly.JavaScript.statementToCode(block, 'DO');
  branch = Blockly.JavaScript.addLoopTrap(branch, block.id);
  return 'while (true) {\n' + branch + '}\n';
};
