/**
 * Generates a heavy cyber displacement and RGB glitch SVG filter.
 *
 * @param {Object} [options={}] Configuration parameters.
 * @param {string} [options.id='heavy-cyber-glitch'] Unique ID for the filter element.
 * @param {number} [options.scale=40] Maximum displacement scale factor.
 * @param {string} [options.speed='1.5s'] Animation duration.
 * @param {string} [options.frequency='0.0 0.95'] Base frequency for turbulence.
 * @returns {string} SVG filter markup string.
 */
export default function (options = {}) {
  const {
    id = 'heavy-cyber-glitch',
    scale = 40,
    speed = '1.5s',
    frequency = '0.0 0.95'
  } = options;

  const peakScale = Math.round(scale * 1.75);

  return `
    <filter id="${id}">
      <feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="1" result="noise">
        <animate attributeName="baseFrequency" 
                 values="0.0 0.95; 0.0 0.1; 0.0 0.8; 0.0 0.95" 
                 dur="0.4s" repeatCount="indefinite" />
      </feTurbulence>

      <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="displaced-image">
        <animate attributeName="scale" 
                 values="0; ${scale}; 0; 0; ${peakScale}; 0; 10; 0" 
                 keyTimes="0; 0.05; 0.08; 0.4; 0.43; 0.46; 0.8; 1" 
                 dur="${speed}" repeatCount="indefinite" />
      </feDisplacementMap>

      <feOffset dx="0" dy="0" in="displaced-image" result="red-channel">
        <animate attributeName="dx" values="0; -15; 0; 10; 0" keyTimes="0; 0.05; 0.1; 0.43; 1" dur="${speed}" repeatCount="indefinite" />
      </feOffset>
      <feColorMatrix type="matrix" in="red-channel" result="red-isolated"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />

      <feOffset dx="0" dy="0" in="displaced-image" result="blue-channel">
        <animate attributeName="dx" values="0; 15; 0; -10; 0" keyTimes="0; 0.03; 0.08; 0.45; 1" dur="${speed}" repeatCount="indefinite" />
      </feOffset>
      <feColorMatrix type="matrix" in="blue-channel" result="blue-isolated"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />

      <feColorMatrix type="matrix" in="displaced-image" result="green-isolated"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" />

      <feBlend mode="screen" in="red-isolated" in2="green-isolated" result="red-green" />
      <feBlend mode="screen" in="red-green" in2="blue-isolated" />
    </filter>
  `.trim();
}
