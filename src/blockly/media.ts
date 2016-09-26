const filepath: string =
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/1x1.gif');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/click.mp3');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/click.ogg');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/click.wav');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/delete.mp3');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/delete.ogg');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/delete.wav');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/disconnect.mp3');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/disconnect.ogg');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/disconnect.wav');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/handclosed.cur');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/handdelete.cur');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/handopen.cur');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/quote0.png');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/quote1.png');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/sprites.png');
require('!file?name=[path][name].[ext]!../../vendor/blockly/media/sprites.svg');

export default filepath.substr(0, filepath.lastIndexOf('/') + 1);
