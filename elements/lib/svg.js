// svg files as markup to put into the page: fetched once per url, without
// scripts, event handlers, javascript: links and foreign content

const cache = new Map;   // url -> Promise<string>

const DROP = 'script, foreignObject, iframe, embed, object';

// the svg element of a text, cleaned, or null for a text that is none
export function sanitizeSvg (text) {
  const doc = new DOMParser().parseFromString(String(text ?? ''), 'image/svg+xml');
  const svg = doc.documentElement;
  if (svg?.localName !== 'svg' || doc.querySelector('parsererror')) return null;

  for (const node of svg.querySelectorAll(DROP)) node.remove();
  for (const node of [svg, ...svg.querySelectorAll('*')]) {
    for (const { name, value } of [...node.attributes]) {
      const link = /^(?:xlink:)?href$/i.test(name) && /^\s*(?:javascript|data:text\/html)/i.test(value);
      if (/^on/i.test(name) || link) node.removeAttribute(name);
    }
  }

  return svg;
}

export function loadSvg (url) {
  const key = new URL(url, document.baseURI).href;
  if (!cache.has(key)) {
    cache.set(key, fetch(key)
      .then(response => { if (!response.ok) throw new Error(`${response.status} ${key}`); return response.text(); })
      .then(text => sanitizeSvg(text)?.outerHTML ?? null)
      .catch(error => { cache.delete(key); throw error; }));
  }
  return cache.get(key);
}
