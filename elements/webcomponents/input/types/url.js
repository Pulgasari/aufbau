import text from './text.js';

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export const normalizeUrl = value => {
  const url = String(value ?? '').trim();
  return !url || SCHEME.test(url) ? url : `https://${url.replace(/^\/+/, '')}`;
};

export default { ...text, icon: 'lucide:link', input: 'url', normalize: normalizeUrl };
