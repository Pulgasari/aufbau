// aufbau/www :: middleware.js (vercel routing middleware, runs at the edge)
//
// the gestalt picked on a demo page (mode, palette, density, geometry,
// skin) goes into the html of every page before it leaves the edge, from the
// cookie elements.html writes. the same tokens aufbau.gestalt sets: a custom
// property and a data attribute each, mode as --scheme / data-scheme.
//
// no imports, web apis only. without a cookie, for anything that is not a page
// and on anything unexpected the page goes out untouched.

const COOKIE = 'aufbau-gestalt';

// the picked name -> the token aufbau's css reads (@aufbau/gestalt)
const TOKENS = { density: 'density', geometry: 'geometry', mode: 'scheme', palette: 'palette', skin: 'skin' };

// a preset name or a css color, nothing that could leave the attribute or the declaration
const SAFE = /^[\w#%.,()\s-]{1,64}$/;

function cookieOf (header, name) {
  for (const part of String(header ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      try   { return decodeURIComponent(rest.join('=')); }
      catch { return null; }
    }
  }
  return null;
}

// token -> value, only the known ones with safe values
function gestaltOf (request) {
  const raw = cookieOf(request.headers.get('cookie'), COOKIE);
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const found  = Object.entries(TOKENS)
    .map(([name, token]) => [token, params.get(name)?.trim()])
    .filter(([, value]) => value && SAFE.test(value));

  return found.length ? Object.fromEntries(found) : null;
}

export default async function middleware (request) {
  if (!(request.headers.get('accept') ?? '').includes('text/html')) return;

  const gestalt = gestaltOf(request);
  if (!gestalt) return;   // nothing picked, the page goes out as it is

  const response = await fetch(request);
  if (!response.ok || !(response.headers.get('content-type') ?? '').includes('text/html')) return response;

  const entries = Object.entries(gestalt);
  const data    = entries.map(([token, value]) => `data-${token}="${value}"`).join(' ');
  const style   = entries.map(([token, value]) => `--${token}: ${value}`).join('; ');
  const html    = (await response.text()).replace(/<html\b/i, `<html ${data} style="${style}"`);

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'private, no-cache');   // the page now depends on the cookie
  headers.set('vary', 'cookie');

  return new Response(html, { headers, status: response.status, statusText: response.statusText });
}

// pages only, the assets never reach it
export const config = {
  matcher: ['/((?!.*\\.(?:css|gif|ico|jpe?g|js|json5?|md|mp3|mp4|pdf|png|svg|ttf|webp|woff2?)$).*)'],
};
