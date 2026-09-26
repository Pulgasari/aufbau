// @aufbau/gestures2/bundles/motion.js
// the motion the bundles share: easing to a point, and gliding on after a
// release. both run on requestAnimationFrame, report every frame and can be
// stopped; a new gesture stops the motion still running.

const easeOut = t => 1 - (1 - t) ** 3;

// from one { x, y } to another in `duration` ms
function tween (from, to, { duration = 250, onFrame, onDone } = {}) {
  let frame = null;
  const began = performance.now();

  const step = now => {
    const t = Math.min(1, (now - began) / duration);
    const k = easeOut(t);
    onFrame({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k });
    if (t < 1) frame = requestAnimationFrame(step);
    else { frame = null; onDone?.(); }
  };

  frame = requestAnimationFrame(step);
  return { stop: () => { cancelAnimationFrame(frame); frame = null; } };
}

// on from `position` with `velocity` (px/ms), slowed by `friction` per 16 ms,
// kept inside `limit` (a function returning the allowed { x, y })
function glide (position, velocity, { friction = 0.94, limit = point => point, minimumSpeed = 0.02, onFrame, onDone } = {}) {
  let frame = null;
  let last  = performance.now();
  let point = { ...position };
  let speed = { ...velocity };

  const step = now => {
    const elapsed = Math.min(64, now - last);
    last = now;
    const decay = friction ** (elapsed / 16);
    speed = { x: speed.x * decay, y: speed.y * decay };

    const next    = { x: point.x + speed.x * elapsed, y: point.y + speed.y * elapsed };
    const limited = limit(next);
    if (limited.x !== next.x) speed.x = 0;   // against a bound: stop on that axis
    if (limited.y !== next.y) speed.y = 0;
    point = limited;
    onFrame(point);

    if (Math.hypot(speed.x, speed.y) > minimumSpeed) frame = requestAnimationFrame(step);
    else { frame = null; onDone?.(point); }
  };

  frame = requestAnimationFrame(step);
  return { stop: () => { cancelAnimationFrame(frame); frame = null; } };
}

export { easeOut, glide, tween };
