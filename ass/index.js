// @aufbau/ass

// 1. Farbmodus: "dark", "light" oder "no-preference"
function getColorScheme() {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'no-preference';
}

// 2. Bewegungsreduzierung: "reduce" oder "no-preference"
function getReducedMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduce';
  // Nur um 100% sicher zu gehen, dass es "no-preference" ist
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return 'no-preference';
  return 'no-preference'; // Fallback
}

// 3. Kontrast: "more", "less", "custom" oder "no-preference"
function getContrast() {
  if (window.matchMedia('(prefers-contrast: more)').matches) return 'more';
  if (window.matchMedia('(prefers-contrast: less)').matches) return 'less';
  if (window.matchMedia('(prefers-contrast: custom)').matches) return 'custom';
  return 'no-preference';
}

const pref = (key, value, type = Bool) => {
  const resolvedKey = {
    // color-scheme
    'color-scheme' : 'color-scheme',
    'scheme'       : 'color-scheme',
    // contrast
    'contrast' : 'contrast',
    // reduced-motion
    'motion'         : 'reduced-motion',
    'reduced-motion' : 'reduced-motion',
  }[key] ?? null;

  if (type === Bool) {
    window.matchMedia(`(prefers-${key}: ${value})`).matches;
  } else {
    if (key === 'color-scheme') {
      for (const value of ['dark', 'light', 'no-preference']) {
        if (pref(key, value)) return true;
      }
    }
    if (key === 'contrast') {
      for (const value of ['custom', 'less', 'more', 'no-preference']) {
        if (pref(key, value)) return true;
      }
    }
    if (key === 'reduced-motion') {
      for (const value of ['reduce', 'no-preference']) {
        if (pref(key, value)) return true;
      }
    }
  }
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
