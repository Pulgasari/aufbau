// @aufbau/gestures/vite.js

/*
in a build, a file that calls `gestures(element, { onLongPress, … })`
gets a gestures of only the recognizers it names.

what it can not read, keeps the whole library: never wrong, only bigger.
- handlers from a variable,
- gestures handed on as a value,
- handle.on(name) with a name from a variable
*/

// :::::: IMPORT

import { parse }          from 'acorn';
import { createUnplugin } from 'unplugin';
import * as recognizers   from '@aufbau/gestures/recognizers/index.js';

// :::::: HELPERS

const // predicates
isArray = Array.isArray,
isString = (sth) => typeof sth === 'string';

// ::::::  CONSTANTS

const PACKAGE = '@aufbau/gestures';

// gesture -> recognizer, from the library itself: doubleTap -> tap
const OWNERS = Object.fromEntries(
  Object.entries(recognizers).flatMap(
    ([name, recognizer]) => recognizer.gestures.map(gesture => [gesture, name])
  )
);

const ownerOf   = (name) => OWNERS[name] ?? (recognizers[name] ? name : null);
const gestureOf = (key)  => key[2].toLowerCase() + key.slice(3);   // onLongPress -> longPress
const keyOf     = (node) => node.key?.name ?? node.key?.value;

function walk (node, visit, parent = null) {
  if (!node || typeof node.type !== 'string') return;
  visit(node, parent);
  for (const key in node) {
    const value = node[key];
    if (Array.isArray(value)) value.forEach(child => walk(child, visit, node));
    else if (value && isString(value.type)) walk(value, visit, node);
  }
}

// the recognizers a file needs, or null when it can not tell
function neededBy (program, local) {
  const needed = new Set;
  let   known  = true;

  const name = value => {
    const owner = isString(value) ? ownerOf(value) : null;
    if (owner) needed.add(owner);
    else known = false;
  };

  walk(program, (node, parent) => {
    if (node.type !== 'Identifier' || node.name !== local) return;
    if (parent?.type === 'ImportDefaultSpecifier' || parent?.type === 'ImportSpecifier') return;

    // gestures(element, { onX, recognize: [...] }): the keys say it
    if (parent?.type === 'CallExpression' && parent.callee === node) {
      const options = parent.arguments[1];
      if (!options) return;
      if (options.type !== 'ObjectExpression') { known = false; return; }
      for (const property of options.properties) {
        if (property.type !== 'Property' || property.computed) { known = false; continue; }
        const key = keyOf(property);
        if (/^on[A-Z]/.test(key)) name(gestureOf(key));
        if (key === 'recognize') property.value.type === 'ArrayExpression' ? property.value.elements.forEach(element => name(element?.value)) : known = false;
      }
      return;
    }

    // anything else (handed on, stored, called through a variable) could need any recognizer
    known = false;
  });

  // handle.on('doubleTap'), handle.recognize('pinch'): a literal names it, anything else gives up
  walk(program, node => {
    if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression') return;
    const method = node.callee.property.name;
    if (method !== 'on' && method !== 'recognize') return;
    const first = node.arguments[0];
    if (first?.type === 'Literal') name(first.value);
    else if (first?.type === 'ArrayExpression') first.elements.forEach(element => name(element?.value));
  });

  return known ? needed : null;
}

export const unplugin = createUnplugin(() => ({
  name    : 'aufbau-gestures',
  enforce : 'post',   // after .rat files are compiled: their js is what is read here

  transformInclude: id => /\.(js|mjs|rat|rat\.html|rat\.js)(\?|$)/.test(id) && !id.includes('/gestures/'),

  transform (code) {
    if (!code.includes(PACKAGE)) return null;
    const program = parse(code, { ecmaVersion: 'latest', sourceType: 'module' });

    const declaration = program.body.find(node => node.type === 'ImportDeclaration' && node.source.value === PACKAGE);
    const specifier   = declaration?.specifiers.find(spec => spec.type === 'ImportDefaultSpecifier' || spec.imported?.name === 'gestures');
    if (!specifier || declaration.specifiers.length > 1) return null;   // bundles or more from the package: as it is

    const needed = neededBy(program, specifier.local.name);
    if (!needed) return null;

    const names   = [...needed].sort();
    const imports = [
      `import { createGestures } from '${PACKAGE}/core.js';`,
      ...names.map(name => `import { ${name} } from '${PACKAGE}/recognizers/${name}.js';`),
      `const ${specifier.local.name} = createGestures({ ${names.join(', ')} });`,
    ].join('\n');

    return code.slice(0, declaration.start) + imports + code.slice(declaration.end);
  },
}));

export default unplugin.vite;

/*
Ehrliche Grenze: In noisy steht @gestures={{ onLongPress }} als Behavior.
rats Compiler macht daraus `$$.use(gestures, () => ({ onLongPress: … }))`,
gestures wird also als Wert weitergereicht und nicht direkt aufgerufen.
Das Plugin gibt dort auf, und es bleibt beim Ganzen. 
Damit es greift, müsste rat Behaviors als Aufruf kompilieren, 
z.B. `use((element, value) => gestures(element, value), …)` mit sichtbarem Objekt. 
Oder das Plugin kennt zusätzlich das Muster `use(gestures, () => ({ … }))`.
*/
