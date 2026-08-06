// @aufbau/stylesheet/skills/shader.js

import { presets } from '@aufbau/shaders';

/**
 * Encodes an SVG string safely into a Data URI for inline CSS usage.
 *
 * @param {string} svgString Raw SVG markup.
 * @returns {string} Encoded Data URI string.
 */
function encodeSvgToDataUri (svgString) {
  const cleanSvg = svgString.replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
}

/**
 * Transforms `aufbau-shader: ...` properties into pure inline SVG filter Data URIs.
 *
 * Supported options syntax:
 *   aufbau-shader: heavy-cyber-glitch scale(60) speed(0.8s);
 *   aufbau-shader: wave frequency(0.05) scale(15);
 *
 * @param {string} code Raw CSS code block.
 * @returns {string} Transformed CSS code block.
 */
export default function (code) {
  return code.replace(/aufbau-shader:\s*([^;}\n]+);?/g, (fullMatch, rawVal) => {
    let val = rawVal.trim();

    // Extract shader preset name (first word)
    const nameMatch = val.match(/^([a-zA-Z0-9_-]+)/);
    if (!nameMatch) return fullMatch;
    

    const shaderName      = nameMatch[1];
    const shaderGenerator = presets[shaderName];

    // Fallback: If no generator function exists, keep standard SVG ID reference
    if (!shaderGenerator) return `filter: url('#${shaderName}');`;

    const options = {};

    // Extract parameters from functional syntax
    val = val.replace(/scale\(([^)]+)\)/g     , (_, v) => { options.scale     = parseFloat(v);   return ''; });
    val = val.replace(/speed\(([^)]+)\)/g     , (_, v) => { options.speed     = v.trim();        return ''; });
    val = val.replace(/frequency\(([^)]+)\)/g , (_, v) => { options.frequency = v.trim();        return ''; });
    val = val.replace(/octaves\(([^)]+)\)/g   , (_, v) => { options.octaves   = parseInt(v, 10); return ''; });
    val = val.replace(/offset\(([^)]+)\)/g    , (_, v) => { options.offsetX   = parseFloat(v);   return ''; });

    // Build a unique filter ID based on passed parameters
    const optionKeys = Object.keys(options).sort();
    const optionHash = optionKeys.map(k => `${k}-${String(options[k]).replace(/[^a-zA-Z0-9]/g, '')}`).join('-');
    const filterId   = optionHash ? `aufbau-${shaderName}-${optionHash}` : `aufbau-${shaderName}`;

    options.id = filterId;

    // Generate full SVG string
    const rawSvgFilter   = shaderGenerator(options);
    const fullSvgWrapper = `<svg xmlns="http://www.w3.org/2000/svg">${rawSvgFilter}</svg>`;
    const dataUri        = encodeSvgToDataUri(fullSvgWrapper); // Convert to Data URI

    return `filter: url('${dataUri}#${filterId}');`;
  });
}
