/**
 * Generates a wave displacement SVG filter.
 *
 * @param {Object} [options={}] Configuration parameters.
 * @param {string} [options.id='wave-shader'] Unique ID for the filter element.
 * @param {number} [options.scale=20] Displacement scale factor.
 * @param {string|number} [options.frequency='0.02'] Base frequency for turbulence.
 * @param {number} [options.octaves=2] Number of turbulence octaves.
 * @returns {string} SVG filter markup string.
 */
export default function (options = {}) {
  const {
    id        = 'wave-shader',
    scale     = 20,
    frequency = '0.02',
    octaves   = 2
  } = options;

  return `<filter id="${id}">
      <feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="${octaves}" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="${scale}" xChannelSelector="R" yChannelSelector="G" />
    </filter>`;
}
