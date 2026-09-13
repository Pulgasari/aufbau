// @aufbau/ass/run.js
// optional browser runtime: compiles inline <style type="text/ass"> blocks in
// place. for the android apps the recommended path is precompiling .ass to .css
// at build time (no runtime cost, no flash); this helper is mainly for dev and
// small pages.

import { compile } from './index.js';

const SELECTOR = 'style[type="text/ass"], style[type="text/aufbau"]';

// compiles every inline ass <style> under `root` and replaces it with a plain
// <style>. returns the number of blocks processed.
export function run (root = document) {
  const styles = root.querySelectorAll(SELECTOR);
  for (const style of styles) {
    const out = document.createElement('style');
    out.textContent = compile(style.textContent);
    style.replaceWith(out);
  }
  return styles.length;
}

export default run;
