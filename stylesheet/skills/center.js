// @aufbau/stylesheet/skills/center.js

/**
 * Wandelt `aufbau-center: flex | grid | absolute | fixed;` um
 */
export function transformCenter (code) {
  return code.replace(/aufbau-center:\s*([^;}\n]*);?/g, (_, rawVal) => {
    const mode = rawVal.trim().toLowerCase();

    switch (mode) {
      case 'grid':
        return 'display: grid; place-items: center;';
      case 'absolute':
        return 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);';
      case 'fixed':
        return 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);';
      case 'flex':
      case 'true':
      case '':
      default:
        return 'display: flex; align-items: center; justify-content: center;';
    }
  });
}

export default transformCenter;
