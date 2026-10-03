// on or off: 'true' when on, empty when off. nothing is submitted when off

import text from './text.js';

export default {
  ...text,
  input  : 'checkbox',
  look   : 'switch',
  parse  : raw   => raw === 'true',
  format : value => value === true || value === 'true' ? 'true' : '',
};
