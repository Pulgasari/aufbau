// @aufbau/webcomponents

import AufbauButton from './AufbauButton.js';
import AufbauIcon   from './AufbauIcon.js';
import AufbauFlag   from './AufbauFlag.js';
// ... alle weiteren Komponenten

export function registerAllComponents () {
  const components = {
    'aufbau-button' : AufbauButton,
    'aufbau-icon'   : AufbauIcon,
    'aufbau-flag'   : AufbauFlag,
    // ...
  };

  Object.entries(components).forEach(([tag, CustomElement]) => {
    if (!customElements.get(tag)) {
      customElements.define(tag, CustomElement);
    }
  });
}

// Auto-register on direct script import
// import '@aufbau/webcomponents'
registerAllComponents();
