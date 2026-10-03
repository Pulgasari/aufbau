// strips the indentation all lines share, as markup inside a template leaves it
export function dedent (text) {
  const [first, ...rest] = String(text ?? '').replace(/\t/g, '  ').split('\n');

  const filled = rest.filter(line => line.trim());
  const indent = filled.length ? Math.min(...filled.map(line => line.match(/^ */)[0].length)) : 0;

  return [first.trimStart(), ...rest.map(line => line.slice(indent))].join('\n').replace(/^\s*\n/, '').trimEnd();
}
