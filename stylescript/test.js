// stylescript/test.js (scratchfile)

import ass, { ASS, StyleSheet, prop, rule, selector } from './index.js';

const ass    = new ASS;
const layout = new ASS.StyleSheet ({ apply: true });
const typo   = new ASS.StyleSheet ({ apply: true });

ass.config = {
  '@import' : ['reset', 'aufbau'],
  '@import' : `reset, aufbau`,
};

ass['@import'] = ['reset', 'aufbau'];
ass['@import'] = `reset, aufbau`;

ass ({
  '@import' : ['reset', 'aufbau'],
  '@import' : `reset, aufbau`,
});

ass.traits['flow-x'] = {
  display       : `flex`,
  flexDirection : `row`,
}

ass.traits.flowX = new ASS.Trait(`
  display        : flex;
  flex-direction : row;
`);

layout.use('flow-x');

/*

--- Classes
ASS
ASS.StyleSheet
ASS.Trait

-- Methods
ASS.toCSS

*/
