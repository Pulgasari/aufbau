// @aufbau/stylesheet/skills/center.js

/**
 * Wandelt den Wert von `aufbau-center: flex | grid | absolute | fixed;` um.
 *
 * Bekommt den Wert, nicht die ganze Deklaration — so wie transformFlex,
 * transformGrid und transformIcons auch. Der Single-Pass-Matcher in ../index.js
 * hat den Property-Namen zu diesem Zeitpunkt bereits abgetrennt.
 */
export function transformCenter (value) {
  switch (String(value ?? '').trim().toLowerCase()) {
    case 'grid':
      return 'display: grid; place-items: center;';
    case 'absolute':
      return 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);';
    case 'fixed':
      return 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);';
    case 'flex':
    case 'true':
    case 'both':
    case '':
    default:
      return 'display: flex; align-items: center; justify-content: center;';
  }
}

export default transformCenter;
