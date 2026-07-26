/**
 * Generates a static RGB channel separation glitch SVG filter.
 *
 * @param {Object} [options={}] Configuration parameters.
 * @param {string} [options.id='glitch-rgb'] Unique ID for the filter element.
 * @param {number} [options.offsetX=5] X-axis offset for channel separation.
 * @param {number} [options.offsetY=0] Y-axis offset for channel separation.
 * @returns {string} SVG filter markup string.
 */
export function glitchRgb (options = {}) {
  const {
    id = 'glitch-rgb',
    offsetX = 5,
    offsetY = 0
  } = options;

  return `
    <filter id="${id}">
      <feOffset dx="-${offsetX}" dy="${offsetY}" in="SourceGraphic" result="red-channel" />
      <feColorMatrix type="matrix" in="red-channel" result="red-isolated"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />

      <feOffset dx="${offsetX}" dy="${offsetY}" in="SourceGraphic" result="blue-channel" />
      <feColorMatrix type="matrix" in="blue-channel" result="blue-isolated"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />

      <feColorMatrix type="matrix" in="SourceGraphic" result="green-isolated"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" />

      <feBlend mode="screen" in="red-isolated" in2="green-isolated" result="red-green" />
      <feBlend mode="screen" in="red-green" in2="blue-isolated" />
    </filter>
  `.trim();
}

/**
 * Generates an animated live RGB glitch SVG filter.
 *
 * @param {Object} [options={}] Configuration parameters.
 * @param {string} [options.id='live-glitch'] Unique ID for the filter element.
 * @param {string} [options.speed='2s'] Animation duration.
 * @returns {string} SVG filter markup string.
 */
export function liveGlitch (options = {}) {
  const {
    id    = 'live-glitch',
    speed = '2s'
  } = options;

  return `<filter id="${id}">
      <feOffset dx="0" dy="0" in="SourceGraphic" result="red-channel">
        <animate attributeName="dx" 
                 values="0; -8; 2; -10; 0; 5; -2; 0" 
                 keyTimes="0; 0.05; 0.07; 0.1; 0.12; 0.2; 0.25; 1" 
                 dur="${speed}" 
                 repeatCount="indefinite" />
      </feOffset>
      <feColorMatrix type="matrix" in="red-channel" result="red-isolated"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />

      <feOffset dx="0" dy="0" in="SourceGraphic" result="blue-channel">
        <animate attributeName="dx" 
                 values="0; 5; -3; 8; 0; -4; 0" 
                 keyTimes="0; 0.03; 0.08; 0.12; 0.18; 0.22; 1" 
                 dur="${speed}" 
                 repeatCount="indefinite" />
      </feOffset>
      <feColorMatrix type="matrix" in="blue-channel" result="blue-isolated"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />

      <feColorMatrix type="matrix" in="SourceGraphic" result="green-isolated"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" />

      <feBlend mode="screen" in="red-isolated" in2="green-isolated" result="red-green" />
      <feBlend mode="screen" in="red-green" in2="blue-isolated" />
    </filter>`;
}
