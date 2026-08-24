// @aufbau/webfonts/google.js

/**
 * Load Google Fonts dynamically via Google Fonts CSS2 API
 * Usage: loadGoogleFont({ family: 'Inter', weights: [400, 700], display: 'swap' })
 */
export const loadGoogleFont = (options) => {
  const { family, weights = [400], display = 'swap' } = options;
  if (!family) return;

  const formattedFamily = family.replace(/\s+/g, '+');
  const weightString = weights.join(';');
  const href = `https://fonts.googleapis.com/css2?family=${formattedFamily}:wght@${weightString}&display=${display}`;

  // Avoid duplicate tags
  if (document.querySelector(`link[href="${href}"]`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Bulk load multiple Google Fonts
 */
export const initGoogleFonts = (fontsList = []) => {
  fontsList.forEach(font => {
    if (typeof font === 'string') {
      loadGoogleFont({ family: font });
    } else {
      loadGoogleFont(font);
    }
  });
};
