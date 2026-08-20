// @aufbau/filters/pipeline.js
// a non-destructive filter stack for editor-style use: hold a source (canvas / image /
// video / bitmap) and an ordered list of stages, and render the whole stack onto a target
// canvas on demand. the source is never mutated, so tweaking, reordering, toggling or
// removing a stage and re-rendering always starts clean.
//
// stages run through filterCanvas, so any backend mixes freely — imageData (pixelate,
// dither), css/svg bridge, and webgl (fisheye, bloom) in one stack. runs of consecutive
// webgl stages are executed gpu-resident as one chain (no 2d round-trip between them);
// imageData/bridge stages break a run and go through filterToCanvas.

import { filterToCanvas } from './canvas.js';
import { filterChainWebgl } from './webgl.js';
import { filters } from './lib/index.js';

// a stage runs on the gpu exactly when filterToCanvas would delegate to webgl: it has a
// webgl backend and no imageData/css/svg backend to take precedence.
function isWebgl (id) {
  const m = filters[id];
  return !!(m && m.webgl && !m.canvas && !m.css && !m.render);
}

function sourceSize (source) {
  return {
    width:  source.naturalWidth  ?? source.videoWidth  ?? source.width,
    height: source.naturalHeight ?? source.videoHeight ?? source.height,
  };
}

/**
 * creates a pipeline over `source`.
 * @param {CanvasImageSource} source canvas, image, imagebitmap or video
 */
export function createPipeline (source) {
  const stages = []; // { id, options, enabled }
  const work   = document.createElement('canvas');
  const wctx   = work.getContext('2d', { willReadFrequently: true });

  const api = {
    stages,
    add (id, options = {}) { stages.push({ id, options: { ...options }, enabled: true }); return api; },
    insert (index, id, options = {}) { stages.splice(index, 0, { id, options: { ...options }, enabled: true }); return api; },
    remove (index) { stages.splice(index, 1); return api; },
    move (from, to) { stages.splice(to, 0, stages.splice(from, 1)[0]); return api; },
    set (index, options) { if (stages[index]) Object.assign(stages[index].options, options); return api; },
    toggle (index, on = !stages[index]?.enabled) { if (stages[index]) stages[index].enabled = on; return api; },
    clear () { stages.length = 0; return api; },

    /** applies the whole stack onto `target` (defaults to an internal canvas) and returns it. */
    render (target = document.createElement('canvas')) {
      const { width, height } = sourceSize(source);
      work.width = width; work.height = height;
      wctx.clearRect(0, 0, width, height);
      wctx.drawImage(source, 0, 0, width, height);

      // apply enabled stages, coalescing consecutive webgl stages into one gpu chain.
      const active = stages.filter(s => s.enabled);
      for (let i = 0; i < active.length;) {
        if (isWebgl(active[i].id)) {
          let j = i; while (j < active.length && isWebgl(active[j].id)) j++;
          filterChainWebgl(work, active.slice(i, j).map(s => ({ id: s.id, options: s.options })));
          i = j;
        } else {
          filterToCanvas(work, active[i].id, active[i].options);
          i++;
        }
      }

      target.width = width; target.height = height;
      const tctx = target.getContext('2d');
      tctx.clearRect(0, 0, width, height);
      tctx.drawImage(work, 0, 0);
      return target;
    },
  };
  return api;
}
