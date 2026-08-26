// utils.js

export const 
clamp = (value, min, max) => Math.max(min, Math.min(max, value)),

// nearest of a fixed set, or nearest multiple of a step, or the value untouched.
snap = (value, steps) => !steps ? value
  : Array.isArray(steps) ? steps.reduce((prev, next) => Math.abs(next - value) < Math.abs(prev - value) ? next : prev)
  : Math.round(value / steps) * steps,

distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
angle    = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI,

// signed shortest difference between two angles in degrees, in (-180, 180].
angleDelta = (from, to) => { let d = (to - from) % 360; return d > 180 ? d - 360 : d <= -180 ? d + 360 : d; };
