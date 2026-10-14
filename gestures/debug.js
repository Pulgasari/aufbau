// @aufbau/gestures/debug
// @ts-self-types="./debug.d.ts"
// an overlay that draws the session of a gestures() handle live: the pointers,
// the start, the center, delta and velocity, plus a panel with the numbers, the
// claims and the last gestures. for tuning thresholds on a real device; load it
// in a playground, not in production.
//
//   import debug from '@aufbau/gestures/debug';
//   const stop = debug(handle);

import { GESTURES } from './index.js';

const TYPES = GESTURES.map(gesture => gesture.toLowerCase());

const round = value => Math.round(value * 100) / 100;

function debug (handle, { color = '#ff2d7a', log = 8 } = {}) {
  const canvas = document.createElement('canvas');
  const panel  = document.createElement('pre');
  Object.assign(canvas.style, { height: '100vh', inset: '0', pointerEvents: 'none', position: 'fixed', width: '100vw', zIndex: '2147483647' });
  Object.assign(panel.style,  { background: 'rgb(0 0 0 / 0.75)', bottom: '0', color: '#fff', font: '11px/1.4 ui-monospace, monospace', left: '0', margin: '0', padding: '8px 10px', pointerEvents: 'none', position: 'fixed', zIndex: '2147483647' });
  document.body.append(canvas, panel);

  const context = canvas.getContext('2d');
  const recent  = [];
  let summary   = 'no session yet';
  let frameId   = null;

  const listener = event => {
    const detail = event.detail;
    if (detail?.element !== handle.element) return;
    recent.unshift(`${detail.gesture}${detail.count > 1 ? ` x${detail.count}` : ''}${detail.direction && detail.gesture.startsWith('swipe') ? ` ${detail.direction}` : ''}`);
    recent.length = Math.min(recent.length, log);
  };
  for (const type of TYPES) handle.element.addEventListener(type, listener);

  const dot = (point, radius, fill) => {
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    fill ? context.fill() : context.stroke();
  };

  const line = (from, to) => {
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  };

  function draw () {
    const ratio  = devicePixelRatio || 1;
    const width  = Math.round(innerWidth  * ratio);
    const height = Math.round(innerHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, innerWidth, innerHeight);
    context.strokeStyle = context.fillStyle = color;
    context.lineWidth   = 2;
    context.font        = '11px ui-monospace, monospace';

    const session = handle.session;
    if (session) {
      for (const point of session.positions ?? []) { dot(point, 22, false); context.fillText(String(point.id), point.x + 26, point.y - 26); }
      dot(session.start, 4, true);
      dot(session.center, 6, true);
      line(session.start, session.center);
      const ahead = { x: session.center.x + session.velocity.x * 100, y: session.center.y + session.velocity.y * 100 };   // where it would be in 100 ms
      context.setLineDash([4, 4]);
      line(session.center, ahead);
      context.setLineDash([]);

      summary = [
        `input     ${session.input}  pointers ${session.pointers} (max ${session.maximumPointers})`,
        `distance  ${round(session.distance)}  travel ${round(session.travel)}  direction ${session.direction ?? '-'}`,
        `speed     ${round(session.velocity.speed)} px/ms  duration ${Math.round(session.duration)} ms`,
        `scale     ${round(session.scale)}  rotation ${round(session.rotation)}°`,
        `pressure  ${round(session.pressure ?? 0)}  tilt ${session.tilt?.x ?? 0}/${session.tilt?.y ?? 0}  twist ${session.twist ?? 0}`,
        `claims    ${[...session.claims].join(', ') || '-'}`,
      ].join('\n');
    }

    panel.textContent = `${summary}\n\n${recent.join('\n') || 'no gesture yet'}`;
    frameId = requestAnimationFrame(draw);
  }

  draw();

  return () => {
    cancelAnimationFrame(frameId);
    for (const type of TYPES) handle.element.removeEventListener(type, listener);
    canvas.remove();
    panel.remove();
  };
}

export { debug };
export default debug;
