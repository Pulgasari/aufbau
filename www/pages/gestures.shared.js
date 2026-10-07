// what the gesture boxes share: the log and the session table of the page,
// the flash and pressed feedback, and mounted() for setup that needs the page

const round  = value => typeof value === 'number' ? Math.round(value * 100) / 100 : value;
const format = value =>
    value == null             ? String(value)
  : value instanceof Element  ? `<${value.localName}${value.id ? '#' + value.id : ''}>`
  : value instanceof Event    ? value.type
  : typeof value === 'object' ? JSON.stringify(value, (key, inner) => round(inner))
  :                             String(round(value));

/** the last gesture's detail, as a table */
export function show (gesture) {
  document.getElementById('gestures-session')?.replaceChildren(...Object.keys(gesture).sort().map(key => {
    const row = document.createElement('tr');
    row.innerHTML = '<td></td><td></td>';
    row.firstChild.textContent = key;
    row.lastChild.textContent  = format(gesture[key]);
    return row;
  }));
}

/** a line on top of the log, the gesture into the table */
export function log (text, gesture) {
  const target = document.getElementById('gestures-log');
  if (target) target.textContent = `${new Date().toLocaleTimeString()}  ${text}\n` + target.textContent.split('\n').slice(0, 60).join('\n');
  if (gesture) show(gesture);
}

export const flash = element => { element.classList.add('flash'); setTimeout(() => element.classList.remove('flash'), 180); };

/** press feedback on an element, spread into the options of gestures() */
export const pressed = element => ({
  onPressCancel : () => element.classList.remove('pressed'),
  onPressEnd    : () => element.classList.remove('pressed'),
  onPressStart  : () => element.classList.add('pressed'),
});

// a ref runs while the part is built, before it is in the page. mounted() waits
// for the part to be put in place, which happens right after, in the same task
export const mounted = setup => element => queueMicrotask(() => setup(element));
