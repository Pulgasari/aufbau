// ass custom properties processing via ast nodes

export function resolveColorShade(val, colorTokens = {}) {
  if (!val) return val;
  if (colorTokens[val]) return colorTokens[val];

  const match = val.match(/^([a-zA-Z0-9_-]+)-(d|l|a)(\d+)$/);
  if (!match) return val;

  const [, baseName, type, pctStr] = match;
  const baseColor = colorTokens[baseName] || baseName;
  const pct = parseInt(pctStr, 10);
  if (isNaN(pct) || pct < 0 || pct > 100) return val;

  const basePct = 100 - pct;
  if (type === 'd') return `color-mix(in srgb, ${baseColor} ${basePct}%, black)`;
  if (type === 'l') return `color-mix(in srgb, ${baseColor} ${basePct}%, white)`;
  if (type === 'a') return `color-mix(in srgb, ${baseColor} ${pct}%, transparent)`;
  return val;
}

export function expandColors(decl, tokenMap) {
  const  colorTokens = tokenMap?.get('color') ? Object.fromEntries(tokenMap.get('color')) : {};
  const colorsTokens = tokenMap?.get('colors') ? Object.fromEntries(tokenMap.get('colors')) : {};

  const items = (decl.value || []).filter(item => item.type !== 'PUNCT').map(item => item.value);
  let bg = '';
  let fg = '';

  if (items.length === 1 && colorsTokens[items[0]]) {
    const pair = colorsTokens[items[0]];
    bg = resolveColorShade(pair.bg, colorTokens);
    fg = resolveColorShade(pair.fg, colorTokens);
  } else if (items.length >= 2) {
    bg = resolveColorShade(items[0], colorTokens);
    fg = resolveColorShade(items[1], colorTokens);
  } else if (items.length === 1) {
    bg = resolveColorShade(items[0], colorTokens);
    fg = 'currentColor';
  }

  return [
    { type: 'Declaration', name: { value: 'background-color' }, value: [{ type: 'IDENTIFIER', value: bg }] },
    { type: 'Declaration', name: { value: 'color' }, value: [{ type: 'IDENTIFIER', value: fg }] }
  ];
}

export function expandPattern(decl, tokenMap) {
  let rotate = 0;
  let bg = 'transparent';
  let fg = 'currentColor';
  let animRule    = '';
  let patternName = 'grid';

  const colorTokens = tokenMap?.get('color') ? Object.fromEntries(tokenMap.get('color')) : {};
  const colorsTokens = tokenMap?.get('colors') ? Object.fromEntries(tokenMap.get('colors')) : {};

  for (const item of (decl.value || [])) {
    if (item.type === 'FuncCall') {
      const fnName = item.name?.value;
      const fnArgs = (item.args || []).map(a => a.value);

      if (fnName === 'rotate' && fnArgs[0]) {
        rotate = parseInt(fnArgs[0], 10) || 0;
      } else if (fnName === 'colors') {
        if (fnArgs.length === 1 && colorsTokens[fnArgs[0]]) {
          bg = resolveColorShade(colorsTokens[fnArgs[0]].bg, colorTokens);
          fg = resolveColorShade(colorsTokens[fnArgs[0]].fg, colorTokens);
        } else if (fnArgs.length >= 2) {
          bg = resolveColorShade(fnArgs[0], colorTokens);
          fg = resolveColorShade(fnArgs[1], colorTokens);
        } else if (fnArgs.length === 1) {
          fg = resolveColorShade(fnArgs[0], colorTokens);
        }
      } else if (fnName === 'animate' && fnArgs[0]) {
        const aName = fnArgs[0].startsWith('aufbau-') ? fnArgs[0] : `aufbau-pattern-${fnArgs[0]}`;
        const aRest = fnArgs.slice(1).join(' ') || '3s linear infinite';
        animRule = `${aName} ${aRest}`;
      }
    } else if (item.type === 'IDENTIFIER' || item.type === 'STRING') {
      patternName = item.value;
    }
  }

  const svg     = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="${bg}"/><circle cx="10" cy="10" r="2" fill="${fg}" transform="rotate(${rotate} 10 10)"/></svg>`;
  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  const decls = [
    { type: 'Declaration', name: { value: 'background-image'  }, value: [{ type: 'STRING',     value: `url('${dataUri}')` }] },
    { type: 'Declaration', name: { value: 'background-repeat' }, value: [{ type: 'IDENTIFIER', value: 'repeat' }] }
  ];

  if (animRule) {
    decls.push({ type: 'Declaration', name: { value: 'animation' }, value: [{ type: 'IDENTIFIER', value: animRule }] });
  }

  return decls;
}

export function expandShader(decl) {
  let shaderName = '';
  const opts = {};

  for (const item of (decl.value || [])) {
    if (item.type === 'IDENTIFIER' && !shaderName) {
      shaderName = item.value;
    } else if (item.type === 'FuncCall') {
      const fnName = item.name?.value;
      const fnArgs = (item.args || []).map(a => a.value);
      if (fnName && fnArgs[0]) opts[fnName] = fnArgs[0];
    }
  }

  if (!shaderName) return [decl];

  const filterId = `aufbau-${shaderName}`;
  const svg      = `<svg xmlns="http://www.w3.org/2000/svg"><filter id="${filterId}"><feTurbulence type="fractalNoise" baseFrequency="${opts.frequency || '0.05'}" numOctaves="${opts.octaves || '2'}"/></filter></svg>`;
  const dataUri  = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return [{ type: 'Declaration', name: { value: 'filter' }, value: [{ type: 'STRING', value: `url('${dataUri}#${filterId}')` }] }];
}

export function expandWebfont(decl, webfontSet) {
  const rawItems = (decl.value || []).filter(item => item.type !== 'PUNCT').map(item => item.value.replace(/['"]/g, ''));
  if (rawItems.length === 0) return [decl];

  const fontName      = rawItems[0];
  const formattedName = fontName.replace(/\s+/g, '+');
  const fontUrl       = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;700&display=swap`;

  if (webfontSet) webfontSet.add(fontUrl);

  const fontLower = fontName.toLowerCase();
  const fallback = fontLower.includes('mono') ? 'monospace' : fontLower.includes('serif') ? 'serif' : 'sans-serif';

  return [{
    type: 'Declaration',
    name: { value: 'font-family' },
    value: [{ type: 'STRING', value: `"${fontName}", ${fallback}` }]
  }];
}

