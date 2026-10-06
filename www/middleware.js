// No dependencies or imports required! Uses native Web Standard APIs.

// Helper to parse cookie values from the raw Cookie header
function getCookie (cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|; )` + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + `=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default async function middleware (request) {
  alert('middleware!'); // test
  
  const startTime = performance.now();
  const url       = new URL(request.url);

  // 1. Filter: Only process HTML page requests
  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/html')) return fetch(request);
  
  // 2. Read raw Cookie header from incoming request
  const cookieHeader = request.headers.get('cookie');
  const theme        = getCookie(cookieHeader, 'theme')   || '#111827';
  const compact      = getCookie(cookieHeader, 'compact') || 'false';

  console.log(`[Edge Middleware] Request: ${url.pathname}${url.search}`);
  console.log(`[Edge Middleware] Parsed cookies -> theme: "${theme}", compact: "${compact}"`);

  // 3. Fetch static HTML file from origin
  const response = await fetch(request);

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  let html = await response.text();

  // 4. Inject styles and dataset attributes into <html...> tag
  const rootAttributes = `style="--theme: ${theme};" data-compact="${compact}"`;
  const htmlInjected   = html.replace('<html', `<html ${rootAttributes}`);

  const duration = (performance.now() - startTime).toFixed(2);
  console.log(`[Edge Middleware] State injected successfully in ${duration}ms`);

  // 5. Construct response with new headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('content-type', 'text/html; charset=utf-8');
  newHeaders.set('Server-Timing', `edge-fouc;desc="Edge State Injection";dur=${duration}`);

  return new Response (htmlInjected, {
    status  : response.status,
    headers : newHeaders,
  });
}

// Optimization: Bypass middleware for static assets
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
};
