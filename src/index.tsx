import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

require('react-tap-event-plugin')();

import './index.css';

import Root from './components/Root';

ReactDOM.render(
  <MuiThemeProvider>
    <Root />
  </MuiThemeProvider>,
  document.getElementById('root')
);
