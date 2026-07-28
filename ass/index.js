// @aufbau/ass

function pref (key, value) {
  const map = {
    'scheme'         : 'color-scheme',
    'color-scheme'   : 'color-scheme',
    'contrast'       : 'contrast',
    'motion'         : 'reduced-motion',
    'reduced-motion' : 'reduced-motion',
    'no'             : 'no-preference',
    'no-preference'  : 'no-preference',
  };
  const feature = map[key];
  if (!feature) throw new Error(`Unbekannte Preference: "${key}"`);

  const possible = {
    'color-scheme'   : ['no-preference', 'dark', 'light'],
    'contrast'       : ['no-preference', 'custom', 'less', 'more'],
    'reduced-motion' : ['no-preference', 'reduce'],
  };

  // Zwei Parameter: expliziter Check
  if (value !== undefined) {
    const bool = window.matchMedia(`(prefers-${feature}: ${value})`).matches;
    return {
      bool, string: value,
      valueOf  () { return this.bool; },
      toString () { return this.string; }
    };
  }

  // Ein Parameter: automatische Erkennung
  let matched = 'no-preference';
  for (const v of possible[feature]) {
    if (window.matchMedia(`(prefers-${feature}: ${v})`).matches) {
      matched = v;
      break;
    }
  }

  const bool = matched !== 'no-preference';
  return {
    bool, string: matched,
    valueOf  () { return this.bool; },
    toString () { return this.string; }
  };
}



const prefersContrast = () => window.matchMedia("(prefers-contrast: more)").matches;
const prefersDark     = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const prefersLight    = () => window.matchMedia("(prefers-color-scheme: light)").matches;  
const prefersReduced  = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches);          

const prefersContrast = () => pref('contrast', 'more');
const prefersDark     = () => pref('scheme', 'dark');
const prefersLight    = () => pref('scheme', 'light');
const prefersReduced  = () => pref('motion', 'reduce');          

const prefers = () => ({
  contrast : prefersContrast () ? true   : false,
  motion   : prefersReduced  () ? false  : true,
  scheme   : prefersDark     () ? 'dark' : 'light',
});


/*
const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

// Initialer Check
darkModeQuery.matches ? switchToDark() : switchToLight();

// Listener für Live-Wechsel
darkModeQuery.addEventListener("change", (e) => {
  if (e.matches) {
    console.log("Nutzer hat auf Dark umgestellt");
  } else {
    console.log("Nutzer hat auf Light umgestellt");
  }
});
*/
