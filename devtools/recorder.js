// @aufbau/devtools/recorder.js
// a classic script, not a module: it has to run in <head>, before any module and
// before the app logs anything.
//
// the devtools panel is a module that loads late, long after boot, the runtime
// and the app have already logged, which is exactly the window where the
// interesting failures happen. this records from <head> into a plain array that
// the console panel drains when it mounts (globalThis.__DEVTOOLS_RECORDER__).
//
// it buffers and forwards, nothing else. no ui, no imports, no work: whatever the
// panel wants to do with the entries is the panel's problem. a page loads it
// unconditionally rather than behind ?dev, because a reload to turn devtools on
// is a reload that loses the very error you wanted to look at.
//
//   <script src="…/@aufbau/devtools/recorder.js"></script>
//
// known cost: the page's own console calls report this file as their call site
// in the browser's native devtools. unavoidable when wrapping console, and the
// reason this stays as thin as it is.

(() => {
  const LEVELS = ['debug', 'error', 'info', 'log', 'trace', 'warn'];
  const MAX    = 500;

  if (globalThis.__DEVTOOLS_RECORDER__) return;   // loaded twice, console is wrapped once

  try {
    const entries  = [];
    const native   = {};
    const recorder = { entries, levels: LEVELS, native, onPush: null };

    // arguments are kept as live references, not serialised: an inspector needs
    // the real object, and the ring buffer keeps the retention bounded. onPush
    // lets the devtools console take live entries without wrapping console a
    // second time; it stays null until a panel claims it, and the buffer fills
    // either way, so the recorder is useful on its own
    const push = (level, args) => {
      const entry = { args, level, time: Date.now() };
      entries.push(entry);
      if (entries.length > MAX) entries.shift();
      try { recorder.onPush?.(entry); } catch {}
    };

    for (const level of LEVELS) {
      native[level]  = console[level]?.bind(console) ?? (() => {});
      console[level] = (...args) => { push(level, args); native[level](...args); };
    }

    // capture phase, because a failed <img>/<script>/<link> fires an error event
    // that does not bubble and never shows up in the console at all
    addEventListener('error', event => {
      const target = event.target;
      const source = target && target !== window && (target.src || target.href);
      push('error', source ? [`failed to load: ${source}`] : [event.error ?? event.message]);
    }, true);

    addEventListener('unhandledrejection', event => push('error', ['unhandled rejection:', event.reason]));
    addEventListener('securitypolicyviolation', event => push('error', [`csp blocked ${event.blockedURI} (${event.violatedDirective})`]));

    // the resource timing buffer silently drops everything past 250 entries, and
    // a big importmap blows through that before the first paint. the data panel
    // reads the buffer through a buffered PerformanceObserver
    performance.setResourceTimingBufferSize?.(1000);

    globalThis.__DEVTOOLS_RECORDER__ = recorder;
  } catch {} // a recorder is never worth taking the page down for
})();
