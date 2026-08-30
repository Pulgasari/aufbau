// @aufbau/patterns/motion.js
// motion is a layer *on top* of a pattern: it scrolls the whole tiling and does
// not care what the tile contains or whether the tile animates itself. it works
// by animating `background-position`, so any pattern painted as a background —
// the datauri mode — can drift in any direction.
//
// the scroll distance is one tile (the pattern's `size`), so the loop is
// seamless: after size px the image is exactly back on itself.
//
// the string builders (motionKeyframes, motionCss) touch no dom and are safe in
// node; the apply helpers run in the browser.

// :::::: DIRECTIONS ::::::::::::::::::::::::::::::::::::::::::::::

// unit vectors in tile space. a positive y scrolls the image downward, a
// positive x rightward. diagonals combine the two.
export const MOTIONS = {
  down       : { x:  0, y:  1 },
  up         : { x:  0, y: -1 },
  left       : { x: -1, y:  0 },
  right      : { x:  1, y:  0 },
  'down-right' : { x:  1, y:  1 },
  'down-left'  : { x: -1, y:  1 },
  'up-right'   : { x:  1, y: -1 },
  'up-left'    : { x: -1, y: -1 },
};

// accept "move-down" / "down" / "downwards" and land on a MOTIONS key
export function normalizeMotion (motion) {
  const key = String(motion).trim().toLowerCase()
    .replace(/^move[-_ ]?/, '')
    .replace(/wards$/, '')
    .replace(/[ _]/g, '-');
  return MOTIONS[key] ? key : 'down';
}

// :::::: STRING BUILDERS (node-safe) ::::::::::::::::::::::::::::

const round = n => Math.round(n * 1000) / 1000;

// a stable, css-safe keyframes name for one direction + tile distance
export function motionName (motion, distance) {
  return `aufbau-pat-${normalizeMotion(motion)}-${String(distance).replace(/[^\w-]/g, '_')}`;
}

// the @keyframes rule that scrolls the background one tile in `motion`'s
// direction. `distance` is the tile size in px.
export function motionKeyframes (motion, distance) {
  const dir  = MOTIONS[normalizeMotion(motion)];
  const dist = Number(distance) || 0;
  const x = round(dir.x * dist);
  const y = round(dir.y * dist);
  return `@keyframes ${motionName(motion, distance)}{from{background-position:0 0}to{background-position:${x}px ${y}px}}`;
}

// keyframes + the `animation` shorthand for one motion, ready to drop into a
// stylesheet. `size` is the pattern tile size; `speed` any css <time>.
export function motionCss (motion, { size = 20, speed = '8s', timing = 'linear' } = {}) {
  const name = motionName(motion, size);
  return {
    name,
    keyframes : motionKeyframes(motion, size),
    animation : `${name} ${speed} ${timing} infinite`,
  };
}

// :::::: DOM (browser) :::::::::::::::::::::::::::::::::::::::::::

const STYLE_ID = 'aufbau-pattern-motion';

function motionStyle () {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  return style;
}

// register a keyframes rule once; returns its name
export function ensureMotion (motion, distance) {
  const name  = motionName(motion, distance);
  const style = motionStyle();
  if (!style.textContent.includes(`@keyframes ${name}{`)) {
    style.textContent += motionKeyframes(motion, distance) + '\n';
  }
  return name;
}

function toElements (target) {
  if (typeof target === 'string') return [...document.querySelectorAll(target)];
  if (target instanceof Element)  return [target];
  if (target?.[Symbol.iterator])  return [...target].filter(el => el instanceof Element);
  return [];
}

// scroll whatever background an element already has. the caller passes the tile
// `size` so the loop stays seamless.
export function applyMotion (target, motion, { size = 20, speed = '8s', timing = 'linear' } = {}) {
  const dir  = normalizeMotion(motion);
  const name = ensureMotion(dir, size);
  for (const el of toElements(target)) {
    el.style.animationName           = name;
    el.style.animationDuration       = speed;
    el.style.animationTimingFunction = timing;
    el.style.animationIterationCount = 'infinite';
    el.dataset.aufbauMotion          = dir;
  }
}

export function stopMotion (target) {
  for (const el of toElements(target)) {
    el.style.removeProperty('animation-name');
    el.style.removeProperty('animation-duration');
    el.style.removeProperty('animation-timing-function');
    el.style.removeProperty('animation-iteration-count');
    delete el.dataset.aufbauMotion;
  }
}

export default { MOTIONS, applyMotion, ensureMotion, motionCss, motionKeyframes, motionName, normalizeMotion, stopMotion };
