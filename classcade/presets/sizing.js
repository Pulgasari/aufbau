// presets/sizing.js

import { scaleOr, spacing } from './tokens.js';

const extra  = { auto: 'auto', full: '100%', screen: '100vw', min: 'min-content', max: 'max-content', fit: 'fit-content' };
const extraH = { auto: 'auto', full: '100%', screen: '100vh', min: 'min-content', max: 'max-content', fit: 'fit-content' };

const resolve = (map, v) => map[v] ?? scaleOr(spacing, v);

export default function sizingPreset (cc) {
  cc.add({ id: 'w',      css: v => ({ width:      resolve(extra,  v) }) });
  cc.add({ id: 'h',      css: v => ({ height:     resolve(extraH, v) }) });
  cc.add({ id: 'min-w',  css: v => ({ 'min-width':  resolve(extra,  v) }) });
  cc.add({ id: 'min-h',  css: v => ({ 'min-height': resolve(extraH, v) }) });
  cc.add({ id: 'max-w',  css: v => ({ 'max-width':  resolve(extra,  v) }) });
  cc.add({ id: 'max-h',  css: v => ({ 'max-height': resolve(extraH, v) }) });
  cc.add({ id: 'size',   css: v => ({ width: resolve(extra, v), height: resolve(extraH, v) }) });
}
