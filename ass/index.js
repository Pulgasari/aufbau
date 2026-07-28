// @aufbau/ass

function prefers (key, value) {
  if (key === undefined) {
    return {
      contrast : pref('contrast'),
      motion   : pref('motion'),
      scheme   : pref('scheme'),
    };
  }

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

const ass = {};
ass.client = { prefers };



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
