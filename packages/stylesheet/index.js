// @aufbau/packages/stylesheet/index.js

const FLEX_DIRECTIONS  = new Set(['row', 'column', 'row-reverse', 'column-reverse']);
const FLEX_WRAPS       = new Set(['wrap', 'nowrap', 'wrap-reverse']);
const ALIGNMENT_TOKENS = new Set([
  'center', 'start', 'end', 'flex-start', 'flex-end',
  'space-between', 'space-around', 'space-evenly', 'stretch', 'baseline'
]);

/**
 * Wandelt `aufbau-flex: ...` um
 */
function transformFlex(value) {
  const tokens       = value.trim().split(/\s+/);
  const declarations = ['display: flex;'];
  const alignments   = [];

  for (const token of tokens) {
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

/**
 * Wandelt `aufbau-grid: ...` um
 */
function transformGrid(value) {
  const declarations = ['display: grid;'];
  let val = value.trim();

  // 1. Auto-Fit Pattern: fit(250px)
  val = val.replace(/fit\(([^)]+)\)/, (_, minSize) => {
    declarations.push(`grid-template-columns: repeat(auto-fit, minmax(${minSize}, 1fr));`);
    return '';
  });

  // 2. Explicit Columns in Klammern: (200px 1fr)
  val = val.replace(/\(([^)]+)\)/, (_, cols) => {
    declarations.push(`grid-template-columns: ${cols};`);
    return '';
  });

  // 3. Gap Pattern: gap(1rem) oder gap(1rem 2rem)
  val = val.replace(/gap\(([^)]+)\)/, (_, gapVal) => {
    declarations.push(`gap: ${gapVal};`);
    return '';
  });

  // Übergebliebene Tokens (z.B. N-Spalten als reine Zahl)
  const remainingTokens = val.trim().split(/\s+/).filter(Boolean);
  for (const token of remainingTokens) {
    if (/^\d+$/.test(token)) {
      // Bsp: aufbau-grid: 3 -> repeat(3, 1fr)
      declarations.push(`grid-template-columns: repeat(${token}, 1fr);`);
    }
  }

  return declarations.join(' ');
}

/**
 * Haupt-Transform-Funktion
 */
export default function transform(code) {
  if (!code) return '';

  return code
    // Transformiert aufbau-flex: ...;
    .replace(/aufbau-flex:\s*([^;}\n]+);?/g, (_, val) => transformFlex(val))
    // Transformiert aufbau-grid: ...;
    .replace(/aufbau-grid:\s*([^;}\n]+);?/g, (_, val) => transformGrid(val));
}

/*

@aufbau gap {
  tiny   : 0.25rem;
  small  : 0.50rem;
  normal : 1.00rem;
  big    : 2.00rem;
  huge   : 3.00rem;
}


*/
