// @aufbau/css/animate/index.js

/*
a thin layer over animations.css: sets the data-animate attributes, restarts,
and reports when the animation is done. everything else stays in css.

await animate('#logo', 'shake', { count: 3, duration: 'fast' });
const handle = animate(items, 'fade', { stagger: '40ms' });
const off = trigger(button, 'click', 'jump');
reveal('.card', 'slide', { from: 'bottom' });
*/

import getElement from '@domina/methods/getElement.js';
import removeAttr from '@domina/methods/removeAttributes.js';
import setAttr    from '@domina/methods/setAttributes.js';

const PREFIX = 'data-animate';

// the parameters animations.css reads, as option names
const PARAMETERS = ['angle', 'count', 'delay', 'direction', 'distance', 'duration', 'ease', 'from', 'opacity', 'scale', 'stagger', 'state', 'timeline', 'turns'];

// :::::: INTERNAL

const attributeOf = key => `${PREFIX}-${key}`;

// an element, a selector, or any list of elements
function elementsOf (target) {
  if (typeof target === 'string') return [...document.querySelectorAll(target)];
  if (target instanceof Element)  return [target];
  return [...(target ?? [])].filter(item => item instanceof Element);
}

function clear (element) {
  element.removeAttribute(PREFIX);
  for (const key of PARAMETERS) element.removeAttribute(attributeOf(key));
}

function write (element, name, options) {
  element.setAttribute(PREFIX, name);
  for (const key of PARAMETERS) {
    if (options[key] !== undefined) element.setAttribute(attributeOf(key), String(options[key]));
  }
}

// the css animation the attributes started, null when there is none (unknown
// name, reduced motion finishes it at once)
const animationOf = (element, name) => element.getAnimations().find(animation => animation.animationName === name) ?? null;

// :::::: MAIN

// plays `name` on the targets. a running animation restarts. without `keep`
// the attributes go once it has finished, the element is back at rest and can
// play again. the handle is thenable: `await animate(…)` waits for the end,
// which an infinite one never reaches
function animate (target, name, options = {}) {
  const { keep = false } = options;
  const elements = elementsOf(target);

  // off and on again: the same name set twice would not restart
  for (const element of elements) clear(element);
  if (elements.length) void elements[0].offsetWidth;
  for (const element of elements) write(element, name, options);

  const animations = elements.map(element => animationOf(element, name));
  const finished   = Promise.all(animations.map(animation => animation?.finished.catch(() => null))).then(() => {
    if (!keep) for (const element of elements) if (element.getAttribute(PREFIX) === name) clear(element);
    return elements;
  });

  return {
    elements, finished,
    pause  : () => { for (const element of elements) element.setAttribute(attributeOf('state'), 'paused'); },
    play   : () => { for (const element of elements) element.setAttribute(attributeOf('state'), 'running'); },
    stop   : () => { for (const element of elements) clear(element); },
    then   : (resolve, reject) => finished.then(resolve, reject),
  };
}

// removes whatever animate() or the markup set
function stop (target) {
  for (const element of elementsOf(target)) clear(element);
}

// plays `name` on every `type` event of the targets, returns the off switch.
// { on: element } plays it there instead, a button shaking its form
function trigger (target, type, name, options = {}) {
  const { on, ...rest } = options;
  const elements = elementsOf(target);
  const listener = event => animate(on ?? event.currentTarget, name, rest);
  for (const element of elements) element.addEventListener(type, listener);
  return () => { for (const element of elements) element.removeEventListener(type, listener); };
}

// plays `name` once, when a target first comes into view. until then it waits
// paused on its first frame (fill-mode both), a fade stays invisible.
// { threshold } is the visible share it waits for. returns the off switch
function reveal (target, name = 'fade', options = {}) {
  const { keep = false, threshold = 0.2, ...rest } = options;
  const elements = elementsOf(target);

  const observer = new IntersectionObserver(entries => {
    for (const { isIntersecting, target: element } of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(element);
      element.setAttribute(attributeOf('state'), 'running');
      animationOf(element, name)?.finished.then(() => { if (!keep) clear(element); }, () => null);
    }
  }, { threshold });

  for (const element of elements) {
    write(element, name, { ...rest, state: 'paused' });
    observer.observe(element);
  }
  return () => observer.disconnect();
}

// :::::: EXPORT

export { animate, reveal, stop, trigger };
export default animate;
