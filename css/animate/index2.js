// @aufbau/css/animate/index.js

/*
a thin layer over animations.css: sets the data-animate attributes, restarts,
and reports when the animation is done. everything else stays in css.

await animate('#logo', 'shake', { count: 3, duration: 'fast' });
const handle = animate(items, 'fade', { stagger: '40ms' });
const off = trigger(button, 'click', 'jump');
reveal('.card', 'slide', { from: 'bottom' });
*/

import forceReflow       from '@domina/methods/forceReflow.js';
import onEvent           from '@domina/methods/onEvent.js';
import resolveElements   from '@domina/methods/resolveElements.js';
import setData           from '@domina/methods/setData.js';
import waitForAnimations from '@domina/methods/waitForAnimations.js';
import { observe }       from '@domina/observer';

// the parameters animations.css reads, as option names. data-animate-<key>
const PARAMETERS = ['angle', 'count', 'delay', 'direction', 'distance', 'duration', 'ease', 'from', 'opacity', 'scale', 'stagger', 'state', 'timeline', 'turns'];      

// :::::: INTERNAL

// { count: 3 } -> { animateCount: 3 }, what setData takes. undefined stays out,
// null removes
const dataOf = options => Object.fromEntries(PARAMETERS
  .filter(key => options[key] !== undefined)
  .map(key => [`animate-${key}`, options[key]]));

// every data-animate attribute set to null, setData removes them
const CLEARED = { animate: null, ...Object.fromEntries(PARAMETERS.map(key => [`animate-${key}`, null])) };

const clear = element => setData(element, CLEARED);
const write = (element, name, options) => setData(element, { animate: name, ...dataOf(options) });

// :::::: MAIN

// plays `name` on the targets. a running animation restarts. without `keep`
// the attributes go once it has finished, the element is back at rest and can
// play again. the handle is thenable: `await animate(…)` waits for the end,
// which an infinite one never reaches
function animate (target, name, options = {}) {
  const { keep = false } = options;
  const elements = resolveElements(target);
  //const each     = elements.forEach;

  // off and on again: the same name set twice would not restart
  elements.forEach(clear);
  forceReflow();
  for (const element of elements) write(element, name, options);
  //each(clear); forceReflow(); each(el => write(el, name, options));

  const finished = waitForAnimations(elements, { name }).then(() => {
    if (!keep) for (const element of elements) if (element.dataset.animate === name) clear(element);
    return elements;
  });

  const state = value => () => { for (const element of elements) setData(element, 'animate-state', value); };

  return {
    elements, finished,
    pause : state('paused'),
    play  : state('running'),
    stop  : () => elements.forEach(clear),
    then  : (resolve, reject) => finished.then(resolve, reject),
  };
}

// removes whatever animate() or the markup set
function stop (target) {
  resolveElements(target).forEach(clear);
}

// plays `name` on every `type` event of the targets, returns the off switch.
// { on: target } plays it there instead, a button shaking its form
function trigger (target, type, name, options = {}) {
  const { on, ...rest } = options;
  return onEvent(target, type, event => animate(on ?? event.currentTarget, name, rest));
}

// plays `name` once, when a target first comes into view. until then it waits
// paused on its first frame (fill-mode both), a fade stays invisible. a
// selector also covers what is added later. { threshold } is the visible share
// it waits for. returns the off switch
function reveal (target, name = 'fade', options = {}) {
  const { keep = false, threshold = 0.2, ...rest } = options;

  return observe(target, {
    onMatch   : element => { if (!element.dataset.animate) write(element, name, { ...rest, state: 'paused' }); },
    onVisible : {
      threshold,
      handler : element => {
        const state = element.dataset.animateState;
        if (state !== 'paused') return;
        state = 'running';
        waitForAnimations(element, { name }).then(() => { if (!keep) clear(element); });
      },
    },
  });
}

// :::::: EXPORT

export { animate, reveal, stop, trigger };
export default animate;
