// @aufbau/filters/webgl.js
// the webgl backend: a fragment-shader runner supporting single- and multi-pass filters,
// and chaining several filters gpu-resident (no 2d round-trip between them).
//
// a filter exports either
//   webgl = { fragment, uniforms(options) }                         // single pass
//   webgl = { passes: [ { fragment, uniforms(options) }, … ] }      // multi pass
// every fragment gets the shared preamble: uSource (previous pass, or the filter's input
// for pass 0), uSource0 (the filter's own input, kept across all its passes — for combine
// passes like bloom), uResolution, uTime (for animated shaders driven in a rAF loop), vUv.
//
// filterChainWebgl runs a list of webgl filters as one gpu pass-chain: three ping-pong
// render targets rotate so each filter's input survives its passes and its output feeds the
// next filter, and only the final pass touches the screen. dom/gl is only used at call time
// (node-safe import). the gl canvas, program cache and targets are reused across calls.

import { filters } from './lib/index.js';

const VERTEX = `attribute vec2 aPos; varying vec2 vUv;
void main () { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const PREAMBLE = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uSource;
uniform sampler2D uSource0;
uniform vec2 uResolution;
uniform float uTime;
`;

let gl, glCanvas, quad;
const programs = new Map;
const rts = [null, null, null]; // three ping-pong render targets { fbo, tex, w, h }

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

// a ping-pong render target (framebuffer + backing texture), reallocated on resize.
function target (slot, width, height) {
  let t = rts[slot];
  if (!t) { t = rts[slot] = { fbo: gl.createFramebuffer(), tex: gl.createTexture(), w: 0, h: 0 }; }
  if (t.w !== width || t.h !== height) {
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
    t.w = width; t.h = height;
  }
  return t;
}

// uploads a canvas/image as a texture (flipped so the on-screen orientation is preserved).
function sourceTexture (source) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  return tex;
}

function setUniform (p, name, value) {
  const loc = gl.getUniformLocation(p, name);
  if (loc === null) return;
  if (typeof value === 'number') gl.uniform1f(loc, value);
  else if (typeof value === 'boolean') gl.uniform1f(loc, value ? 1 : 0);
  else if (Array.isArray(value)) {
    if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
    else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2]);
    else if (value.length === 4) gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
  }
}

const passList = meta => meta.webgl.passes ?? [{ fragment: meta.webgl.fragment, uniforms: meta.webgl.uniforms }];

/**
 * runs a list of webgl filters as one gpu-resident chain, in place on a 2d canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {{id:string, options?:object}[]} stages — filters with a webgl backend
 */
export function filterChainWebgl (canvas, stages) {
  const chain = stages.filter(s => filters[s.id]?.webgl);
  if (chain.length === 0) return;

  const { width, height } = canvas;
  context(width, height);
  const source = sourceTexture(canvas);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);

  let inputTex = source, inputRt = -1; // inputRt = -1 means the input is the uploaded source

  for (let k = 0; k < chain.length; k++) {
    const meta    = filters[chain[k].id];
    const passes  = passList(meta);
    const options = chain[k].options || {};
    const time    = options.time ?? 0;
    const origin  = inputTex;                          // this filter's input, kept as uSource0
    const scratch = [0, 1, 2].filter(i => i !== inputRt); // two targets that never hold the input
    let read = inputTex, readRt = inputRt;

    for (let i = 0; i < passes.length; i++) {
      const toScreen = i === passes.length - 1 && k === chain.length - 1;
      const writeRt  = toScreen ? -1 : (scratch.find(s => s !== readRt) ?? scratch[0]);
      const dest     = toScreen ? null : target(writeRt, width, height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, toScreen ? null : dest.fbo);
      gl.viewport(0, 0, width, height);

      const prog = program(passes[i].fragment);
      gl.useProgram(prog);
      const aPos = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, read);
      gl.uniform1i(gl.getUniformLocation(prog, 'uSource'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, origin);
      gl.uniform1i(gl.getUniformLocation(prog, 'uSource0'), 1);
      gl.uniform2f(gl.getUniformLocation(prog, 'uResolution'), width, height);
      gl.uniform1f(gl.getUniformLocation(prog, 'uTime'), time);
      const uniforms = passes[i].uniforms ? passes[i].uniforms(options) : {};
      for (const [name, value] of Object.entries(uniforms)) setUniform(prog, name, value);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!toScreen) { read = dest.tex; readRt = writeRt; }
    }
    inputTex = read; inputRt = readRt; // this filter's output feeds the next
  }

  gl.deleteTexture(source);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(glCanvas, 0, 0);
}

/** runs a single filter's webgl backend on a 2d canvas in place. */
export function filterToWebgl (canvas, id, options = {}) {
  const meta = filters[id];
  if (!meta) throw new Error(`[@aufbau/filters] unknown filter "${id}"`);
  if (!meta.webgl) throw new Error(`[@aufbau/filters] "${id}" has no webgl backend`);
  filterChainWebgl(canvas, [{ id, options }]);
}

// feature probe, used by supports()/resolvers without forcing context creation on import.
export function webglAvailable () {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch { return false; }
}
