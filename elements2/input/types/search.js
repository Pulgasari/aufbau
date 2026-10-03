// a search query. emits `search` with { query } once the typing paused
// (`debounce`, 250ms), so a list can filter without reacting to every key

import text from './text.js';

export default {
  ...text,
  actions     : 'clear',
  attributes  : ['debounce'],
  icon        : 'lucide:search',
  input       : 'search',
  placeholder : 'search…',

  setup (host, on) {
    let timer = null;
    on('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => host.emit('search', { query: host.value }), Number(host.getAttribute('debounce') ?? 250));
    });
    host.track(() => clearTimeout(timer));
  },
};
