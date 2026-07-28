// @aufbau/ass

import { renderToCSS } from './codegen.js';
import { ASSEngine }   from './engine.js';
import { parseASS }    from './parser.js';

import { attachAssToDOM } from './runtime/dom.js';
import { defaultTokens, createDefaultTokenMap } from './tokens.js';


export function compileASS (source, options = {}) {
  const ast       = parseASS( source );
  const engine    = new ASSEngine( options );
  const evaluated = engine.evaluate( ast );
  return renderToCSS( evaluated );
}

export {
  ASSEngine, 
  parseASS,
  renderToCSS,

  attachAssToDOM,
  createDefaultTokenMap, 
  defaultTokens,
};
