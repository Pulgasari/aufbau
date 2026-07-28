// @aufbau/patterns/index.js

/**
 * Encodes an SVG string into an optimized utf8 Data-URI.
 */
function encodeSvg (svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Stripes pattern generator.
 */
export function stripes ({ bg = 'transparent', fg = 'currentColor', rotate = 0 } = {}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
  <defs>
    <pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(${rotate})">
      <rect width="20" height="20" fill="${bg}"/>
      <line x1="0" y1="0" x2="0" y2="20" stroke="${fg}" stroke-width="4"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#p)"/>
</svg>`;

  return encodeSvg(svg);
}

/**
 * Dots pattern generator.
 */
export function dots ({ bg = 'transparent', fg = 'currentColor', rotate = 0 } = {}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
  <defs>
    <pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(${rotate})">
      <rect width="20" height="20" fill="${bg}"/>
      <circle cx="10" cy="10" r="3" fill="${fg}"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#p)"/>
</svg>`;

  return encodeSvg(svg);
}

/**
 * Grid pattern generator.
 */
export function grid ({ bg = 'transparent', fg = 'currentColor', rotate = 0 } = {}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
  <defs>
    <pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(${rotate})">
      <rect width="20" height="20" fill="${bg}"/>
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${fg}" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#p)"/>
</svg>`;

  return encodeSvg(svg);
}
