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

Blockly.JavaScript['when_run'] = () => '\n';
