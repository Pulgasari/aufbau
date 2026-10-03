import text from './text.js';

export default {
  ...text,
  input  : 'checkbox',
  look   : 'switch',
  parse  : raw   => raw === 'true',
  format : value => value === true || value === 'true' ? 'true' : '',
};
