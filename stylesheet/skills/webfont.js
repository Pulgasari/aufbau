// @aufbau/stylesheet/skills/webfont.js

const GOOGLE_FONTS_BASE = 'https://fonts.googleapis.com/css2?family=';
const WEBFONT_REGEX     = /aufbau-webfont\s*:\s*['"]?([^;'"]+)['"]?;?/g;

const WEBFONT_MAP = {
  'Hubot Sans'     : { wght: 'ital,wght@0,200..900;1,200..900', fallback: 'monospace' },
  'Inter'          : { wght: 'wght@400;500;700' , fallback: 'sans-serif' },
  'JetBrains Mono' : { wght: 'wght@400;500;700' , fallback: 'monospace'  },
  'Fira Code'      : { wght: 'wght@400;700'     , fallback: 'monospace'  },
  'Roboto'         : { wght: 'wght@400;700'     , fallback: 'sans-serif' },
};

//const WEBFONT_MAP = new Map;
//WEBFONT_MAP.set('Hubot Sans' , { wght: 'ital,wght@0,200..900;1,200..900', fallback: 'monospace' });


function buildFontUrl (fontFamily, wght = 'wght@400;500;700') {
  const formattedFamily = encodeURIComponent(fontFamily).replace(/%20/g, '+');
  return `${GOOGLE_FONTS_BASE}${formattedFamily}:${wght}&display=swap`;
}

export default function (code) {
  const imports = new Set;

  code = code.replace(WEBFONT_REGEX, (_, fontName) => {
    const rawName    = fontName.trim();
    const matchedKey = Object.keys(WEBFONT_MAP).find( key => key.toLowerCase() === rawName.toLowerCase() );

    if (matchedKey) {
      const { wght, fallback } = WEBFONT_MAP[matchedKey];
      imports.add(buildFontUrl(matchedKey, wght));
      return `font-family: "${matchedKey}", ${fallback};`;
    }

    // Dynamic Google Font Fallback (falls der Font nicht in der Map steht)
    imports.add(buildFontUrl(rawName));
    return `font-family: "${rawName}", sans-serif;`;
  });

  return { code, imports: Array.from(imports) };
}
