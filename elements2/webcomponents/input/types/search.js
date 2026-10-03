import { debounce } from '@pulgasari/timing';

import text from './text.js';

export default {
  ...text,
  actions     : 'clear',
  attributes  : ['debounce'],
  icon        : 'lucide:search',
  input       : 'search',
  placeholder : 'search…',

  setup (host, scope) {
    const announce = debounce(() => host.emit('search', { query: host.value }), Number(host.getAttribute('debounce') ?? 250));
    host.track(announce.cancel);
    scope.on('input', announce);
  },
};
