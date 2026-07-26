// @aufbau/stylesheet/layout.js

import { resolveToken } from './tokens.js';

const FLEX_DIRECTIONS  = new Set(['row', 'column', 'row-reverse', 'column-reverse']);
const FLEX_WRAPS       = new Set(['wrap', 'nowrap', 'wrap-reverse']);
const ALIGNMENT_TOKENS = new Set([
  'center', 'start', 'end', 'flex-start', 'flex-end',
  'space-between', 'space-around', 'space-evenly', 'stretch', 'baseline'
]);

export function transformFlex(value, tokens) {
  let val = value.trim();
  const declarations = ['display: flex;'];
  const alignments = [];

  // Matcht gap(...) z.B. gap(small) oder gap(1rem)
  val = val.replace(/gap\(([^)]+)\)/, (_, gapKey) => {
    const resolvedGap = resolveToken(tokens, 'gap', gapKey.trim());
    declarations.push(`gap: ${resolvedGap};`);
    return '';
  });

  const remainingTokens = val.split(/\s+/).filter(Boolean);

  for (const token of remainingTokens) {
    if (FLEX_DIRECTIONS.has(token)) {
      declarations.push(`flex-direction: ${token};`);
    } else if (FLEX_WRAPS.has(token)) {
      declarations.push(`flex-wrap: ${token};`);
    } else if (ALIGNMENT_TOKENS.has(token)) {
      alignments.push(token);
    }
  }

  if (alignments.length === 1) {
    declarations.push(`align-items: ${alignments[0]};`);
    declarations.push(`justify-content: ${alignments[0]};`);
  } else if (alignments.length >= 2) {
    declarations.push(`align-items: ${alignments[0]};`);
    declarations.push(`justify-content: ${alignments[1]};`);
  }

  return declarations.join(' ');
}

export function transformGrid(value, tokens) {
  let val = value.trim();
  const declarations = ['display: grid;'];

  // 1. fit(250px)
  val = val.replace(/fit\(([^)]+)\)/, (_, minSize) => {
    declarations.push(`grid-template-columns: repeat(auto-fit, minmax(${minSize}, 1fr));`);
    return '';
  });

  // 2. Explicit Columns in Klammern (200px 1fr)
  val = val.replace(/\(([^)]+)\)/, (_, cols) => {
    declarations.push(`grid-template-columns: ${cols};`);
    return '';
  });

  // 3. gap(...) mit Token-Resolution
  val = val.replace(/gap\(([^)]+)\)/, (_, gapKey) => {
    const resolvedGap = resolveToken(tokens, 'gap', gapKey.trim());
    declarations.push(`gap: ${resolvedGap};`);
    return '';
  });

  // Numbers -> Columns
  const remainingTokens = val.split(/\s+/).filter(Boolean);
  for (const token of remainingTokens) {
    if (/^\d+$/.test(token)) {
      declarations.push(`grid-template-columns: repeat(${token}, 1fr);`);
    }
  }

  return declarations.join(' ');
}

export function transformLayouts (code, tokens) {
  return code
    .replace(/aufbau-flex:\s*([^;}\n]+);?/g, (_, val) => transformFlex(val, tokens))
    .replace(/aufbau-grid:\s*([^;}\n]+);?/g, (_, val) => transformGrid(val, tokens));
}


export default transformLayouts;
