// @aufbau/filters/webgl.js
// the webgl backend: a minimal single-pass fragment-shader runner. a filter exports
//   webgl = { fragment, uniforms(options) => { name: value } }
// where the fragment is glsl using the shared preamble below (uSource, vUv, uResolution)
// plus its own `uniform` declarations. this is the realtime, "cover everything" tier —
// fisheye, mirror, kaleidoscope, zoom blur: effects svg/canvas cannot do, at framerate.
//
// dom/gl is only touched at call time, so this stays safe to import in node. one webgl
// canvas + program cache are reused across calls (editor-friendly).

import { filters } from './lib/index.js';

const VERTEX = `attribute vec2 aPos; varying vec2 vUv;
void main () { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const PREAMBLE = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uSource;
uniform vec2 uResolution;
`;

let gl, glCanvas, quad;
const programs = new Map;

function context (width, height) {
  if (!glCanvas) {
    glCanvas = document.createElement('canvas');
    gl = glCanvas.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error('[@aufbau/filters] webgl is not available');
    quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  }
  if (glCanvas.width !== width || glCanvas.height !== height) { glCanvas.width = width; glCanvas.height = height; }
  return gl;
}

function compile (type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error('[@aufbau/filters] shader compile: ' + gl.getShaderInfoLog(shader));
  }
  return shader;
}

function program (fragment) {
  if (programs.has(fragment)) return programs.get(fragment);
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, PREAMBLE + fragment));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error('[@aufbau/filters] program link: ' + gl.getProgramInfoLog(p));
  }
  programs.set(fragment, p);
  return p;
}

// sets a uniform from a plain js value: number/boolean -> float, array -> vecN.
function setUniform (p, name, value) {
  const loc = gl.getUniformLocation(p, name);
  if (loc === null) return;
  if (typeof value === 'number')  gl.uniform1f(loc, value);
  else if (typeof value === 'boolean') gl.uniform1f(loc, value ? 1 : 0);
  else if (Array.isArray(value)) {
    if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
    else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2]);
    else if (value.length === 4) gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
  }
}

/** runs a filter's webgl backend on a 2d canvas in place. */
export function filterToWebgl (canvas, id, options = {}) {
  const meta = filters[id];
  if (!meta) throw new Error(`[@aufbau/filters] unknown filter "${id}"`);
  if (!meta.webgl) throw new Error(`[@aufbau/filters] "${id}" has no webgl backend`);

  const { width, height } = canvas;
  context(width, height);
  const p = program(meta.webgl.fragment);
  gl.useProgram(p);

  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

  const aPos = gl.getAttribLocation(p, 'aPos');
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  gl.uniform1i(gl.getUniformLocation(p, 'uSource'), 0);
  gl.uniform2f(gl.getUniformLocation(p, 'uResolution'), width, height);
  const uniforms = meta.webgl.uniforms ? meta.webgl.uniforms(options) : {};
  for (const [name, value] of Object.entries(uniforms)) setUniform(p, name, value);

  gl.viewport(0, 0, width, height);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.deleteTexture(tex);

  // composite the gl result back onto the source 2d canvas.
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(glCanvas, 0, 0);
}

// feature probe, used by supports()/resolvers without forcing context creation on import.
export function webglAvailable () {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch { return false; }
}
