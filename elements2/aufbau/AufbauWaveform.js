import { AufbauElement } from '../base/index.js';

const clamp = value => Math.min(100, Math.max(0, value));

let sharedContext = null;
const audioContext = () => {
  const Context = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  return sharedContext ??= Context ? new Context : null;
};

const barsMask = (peaks) => {
  const rects = peaks.map((peak, index) => {
    const height = Math.max(15, peak * 100);
    return `<rect x="${index * 10 + 1.5}" y="${(100 - height) / 2}" width="7" height="${height}"/>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${peaks.length * 10} 100" preserveAspectRatio="none">${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

export default class AufbauWaveform extends AufbauElement {
  static attr = {
    bars        : 40,
    interactive : Boolean,
    peaks       : String,
    progress    : 0,
    rangeEnd    : Number,
    rangeStart  : Number,
    src         : String,
  };

  static styles = `aufbau-waveform {
    --waveform-played : currentColor;
    --waveform-range  : color-mix(in srgb, currentColor 60%, transparent);
    --waveform-rest   : color-mix(in srgb, currentColor 25%, transparent);

    background :
      linear-gradient(to right, var(--waveform-played) var(--waveform-progress, 0%), transparent 0),
      linear-gradient(to right,
        var(--waveform-rest)  var(--waveform-start, 0%),
        var(--waveform-range) var(--waveform-start, 0%) var(--waveform-end, 0%),
        var(--waveform-rest)  var(--waveform-end, 0%));
    block-size : var(--waveform-height, 3em);
    display    : block;
    mask       : var(--waveform-bars, none) center / 100% 100% no-repeat;

    &[interactive] { cursor: pointer; touch-action: pan-y; }
  }`;

  onMount () {
    this.on('click', (event) => {
      if (!this.getAttr('interactive')) return;
      const rect = this.getBoundingClientRect();
      this.seek((event.clientX - rect.left) / rect.width * 100);
    });

    this.on('keydown', (event) => {
      if (!this.getAttr('interactive')) return;
      const step = { ArrowLeft: -5, ArrowRight: 5, Home: -100, End: 100 }[event.key];
      if (step === undefined) return;
      event.preventDefault();
      this.seek(this.getAttr('progress') + step);
    });
  }

  seek (progress) {
    const value = clamp(progress);
    this.setAttr({ progress: value });
    this.emit('aufbau-waveform-seek', { progress: value });
    return this;
  }

  async update () {
    const { bars, peaks: raw, src } = this.getAttr();

    const given = this.parsePeaks(raw);

    if (!given && src && src !== this._loadedSrc) {
      this._loadedSrc = src;
      const decoded = await this.decodePeaks(src, bars);
      if (this._loadedSrc !== src) return this;   // a newer src took over meanwhile
      this._decoded = decoded;
    }

    const peaks = given ?? this._decoded ?? Array(bars).fill(0.2);
    const key   = peaks.join();

    if (key !== this._maskKey) {
      this._maskKey = key;
      this.style.setProperty('--waveform-bars', barsMask(peaks));
    }

    return super.update();
  }

  render () { return null; }

  sync () {
    const { interactive, progress, rangeEnd, rangeStart } = this.getAttr();
    const hasRange = rangeStart != null && rangeEnd != null;

    this.style.setProperty('--waveform-progress', `${clamp(progress)}%`);
    this.style.setProperty('--waveform-start',    hasRange ? `${clamp(rangeStart)}%` : '0%');
    this.style.setProperty('--waveform-end',      hasRange ? `${clamp(rangeEnd)}%`   : '0%');

    if (interactive) this.tabIndex = 0;
    else this.removeAttribute('tabindex');

    if (this.internals) {
      this.internals.role         = interactive ? 'slider' : 'img';
      this.internals.ariaValueNow = interactive ? String(Math.round(progress)) : null;
      this.internals.ariaValueMin = interactive ? '0'   : null;
      this.internals.ariaValueMax = interactive ? '100' : null;
      this.internals.ariaLabel    = 'waveform';
    }
  }

  parsePeaks (raw) {
    if (!raw) return null;

    let values;
    try {
      values = Array.isArray(raw) ? raw
             : raw.trim().startsWith('[') ? JSON.parse(raw)
             : raw.split(/[\s,]+/).filter(Boolean);
    } catch { return null; }

    values = values.map(Number).filter(Number.isFinite);
    if (!values.length) return null;

    const max = Math.max(...values.map(Math.abs)) || 1;
    return values.map(value => Math.abs(value) / max);
  }

  async decodePeaks (url, samples) {
    try {
      const context = audioContext();
      if (!context) return Array(samples).fill(0.3);

      const buffer    = await context.decodeAudioData(await (await fetch(url)).arrayBuffer());
      const channel   = buffer.getChannelData(0);
      const blockSize = Math.floor(channel.length / samples) || 1;
      const peaks     = [];

      for (let sample = 0; sample < samples; sample++) {
        let sum = 0;
        for (let offset = 0; offset < blockSize; offset++) sum += Math.abs(channel[sample * blockSize + offset] ?? 0);
        peaks.push(sum / blockSize);
      }

      const max = Math.max(...peaks) || 1;
      return peaks.map(peak => peak / max);
    } catch (error) {
      console.warn(`[aufbau-waveform] could not decode audio from "${url}":`, error);
      return Array(samples).fill(0.3);
    }
  }
}

AufbauWaveform.init();
