import text from './text.js';

const SPELLED = { ä: 'ae', ö: 'oe', ß: 'ss', ü: 'ue' };

export const slugify = value => String(value ?? '')
  .toLowerCase()
  .replace(/[äöüß]/g, char => SPELLED[char])
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

function sourceOf (host) {
  const selector = host.getAttribute('source');
  if (!selector) return null;
  return (host.closest('form') ?? document).querySelector(selector) ?? document.querySelector(selector);
}

export default {
  ...text,
  attributes : ['source'],
  icon       : 'lucide:link-2',
  normalize  : slugify,

  setup (host, on) {
    let edited = false;
    on(host.root, 'keydown', event => { if (event.key !== 'Tab') edited = true; });

    const source = sourceOf(host);
    if (source) on(source, 'input', () => { if (!edited) host.setValue(slugify(source.value)); });
  },
};
