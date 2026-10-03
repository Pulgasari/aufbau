// a line of text. the base the other types spread

export default {
  icon   : null,
  input  : 'text',
  look   : 'field',
  parse  : raw   => raw   == null ? '' : String(raw),
  format : value => value == null ? '' : String(value),
};
