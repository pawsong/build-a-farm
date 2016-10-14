import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
require('react-tap-event-plugin')();

import Overlay from './ui/Overlay';
import LoadingSpinner from './ui/LoadingSpinner';
import './index.css';
import './index.dev.css';
import Root from './components/Root';

const overlay = new Overlay();
const loadingSpinner = new LoadingSpinner();

function getCpuCount(): Promise<number> {
  // TODO: Use polyfill
  return Promise.resolve(navigator['hardwareConcurrency'] || 1);
}

(async () => {
  const cpuCount = await getCpuCount();

  ReactDOM.render(
    <MuiThemeProvider>
      <Root
        overlay={overlay}
        loadingSpinner={loadingSpinner}
        cpuCount={cpuCount}
      />
    </MuiThemeProvider>,
    document.getElementById('root')
  );
})();
