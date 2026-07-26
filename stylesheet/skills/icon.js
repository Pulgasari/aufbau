// @aufbau/stylesheet/skills/icon.js

const ICONIFY_BASE = 'https://api.iconify.design/';

/**
 * Wandelt `aufbau-icon: 'prefix:name' size(...) color(...);` um
 */
export function transformIcons (code, tokens) {
  return code.replace(/aufbau-icon:\s*([^;}\n]+);?/g, (fullMatch, rawVal) => {
    let val = rawVal.trim();

    // Extract Icon Name: "bx:search" oder "bx/search"
    const iconMatch = val.match(/["']?([a-zA-Z0-9_-]+[:\/][a-zA-Z0-9_-]+)["']?/);
    if (!iconMatch) return fullMatch;

    const rawIcon = iconMatch[1];
    const iconPath = rawIcon.replace(':', '/') + '.svg';
    const iconUrl = `${ICONIFY_BASE}${iconPath}`;

    // Size extraction (Default: 1em)
    let size = '1em';
    val = val.replace(/size\(([^)]+)\)/, (_, sizeVal) => {
      size = sizeVal.trim();
      return '';
    });

    // Color extraction (Default: currentColor)
    let color = 'currentColor';
    val = val.replace(/color\(([^)]+)\)/, (_, colorVal) => {
      const cleanColor = colorVal.trim();
      // Löst Tokens aus @aufbau color auf (auch mit Shades wie brand-d20)
      color = tokens?.color?.[cleanColor] || cleanColor;
      return '';
    });

    return [
      `display: inline-block;`,
      `width: ${size};`,
      `height: ${size};`,
      `background-color: ${color};`,
      `-webkit-mask-image: url('${iconUrl}');`,
      `mask-image: url('${iconUrl}');`,
      `-webkit-mask-repeat: no-repeat;`,
      `mask-repeat: no-repeat;`,
      `-webkit-mask-size: contain;`,
      `mask-size: contain;`
    ].join(' ');
  });
}

export default transformIcons;
