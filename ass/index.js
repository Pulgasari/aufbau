// @aufbau/ass

const prefersContrast = () => window.matchMedia("(prefers-contrast: more)").matches;
const prefersDark     = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const prefersLight    = () => window.matchMedia("(prefers-color-scheme: light)").matches;  
const prefersReduced  = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches);          

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
