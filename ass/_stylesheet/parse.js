// @aufbau/stylesheet/skills/parse.js
// shared helpers for the hand written at-rule parsers. css comments are legal
// anywhere, so they have to be handled explicitly. without this a single comment
// silently swallows the declaration behind it, and a '}' inside one cuts a block
// short and leaks the remainder into the emitted css.

const COMMENT = /\/\*[\s\S]*?\*\//g;

/** removes css comments. used on block bodies before they get parsed */
export const stripComments = (text) => text.replace(COMMENT, '');

/**
 * index just past the closing brace of a block whose opening brace is already
 * consumed. braces inside comments do not count towards the depth.
 * an unterminated comment swallows the rest of the input, same as a css parser.
 */
export function blockEnd (code, from) {
  let depth = 1;
  let i     = from;

  while (i < code.length && depth > 0) {
    if (code[i] === '/' && code[i + 1] === '*') {
      const close = code.indexOf('*/', i + 2);
      i = close === -1 ? code.length : close + 2;
      continue;
    }
         if (code[i] === '{') depth++;
    else if (code[i] === '}') depth--;
    i++;
  }

  return i;
}
