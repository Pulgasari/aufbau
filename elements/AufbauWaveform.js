// <aufbau-waveform>

import { AufbauElement } from './core/index.js';

let sharedAudioCtx = null;
function getAudioContext() {
  if (!sharedAudioCtx && typeof window !== 'undefined') {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

export default class AufbauWaveform extends AufbauElement {
  static attr = {
    src         : String,
    peaks       : String,   // precomputed 0..1 amplitudes — skips the decode when set
    bars        : 40,
    progress    : 0,
    interactive : Boolean
  };

  onMount () {
    this.on('click', (e) => {
      if (!this.getAttr('interactive')) return;

      const rect = this.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progressPercent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));

      this.setAttributes({ progress: progressPercent });
      this.emit('aufbau-waveform-seek', { progress: progressPercent });
    });
  }

  async update () {
    const { src, peaks: rawPeaks, bars: barCount, progress } = this.getAttr();

    // caller-supplied peaks win — the audio apps already computed them and must
    // not trigger a second fetch + decode of the same file
    const given = this.parsePeaks(rawPeaks);

    if (!given && src && src !== this._loadedSrc) {
      this._loadedSrc = src;
      this._barPeaks = await this.fetchAndDecodePeaks(src, barCount);
    }

    const peaks = given || this._barPeaks || Array(barCount).fill(0.2);

    this.innerHTML = `
      <div class="aufbau-waveform-wrapper">
        ${peaks.map((heightPercent, index) => {
          const barProgress = (index / peaks.length) * 100;
          const isActive = barProgress <= progress;

          return `
            <div 
              class="waveform-bar ${isActive ? 'is-active' : ''}" 
              style="height: ${Math.max(15, heightPercent * 100)}%;"
            ></div>
          `;
        }).join('')}
      </div>
    `;
  }

  // accepts a JSON array ("[0.2,0.8,…]") or a plain comma/space list; returns a
  // normalised 0..1 array, or null when nothing usable was given
  parsePeaks (raw) {
    if (!raw) return null;
    let values;
    try {
      values = Array.isArray(raw) ? raw
        : raw.trim().startsWith('[') ? JSON.parse(raw)
        : raw.split(/[\s,]+/).filter(Boolean).map(Number);
    } catch { return null; }

    values = (values || []).map(Number).filter(n => Number.isFinite(n));
    if (!values.length) return null;

    const max = Math.max(...values.map(Math.abs)) || 1;
    return values.map(v => Math.abs(v) / max);
  }

  async fetchAndDecodePeaks (url, samples) {
    try {
      const response    = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioCtx    = getAudioContext();
      if (!audioCtx) return Array(samples).fill(0.3);

      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const rawData     = audioBuffer.getChannelData(0);
      const blockSize   = Math.floor(rawData.length / samples);
      const peaks = [];

      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[i * blockSize + j]);
        }
        peaks.push(sum / blockSize);
      }

      const maxPeak = Math.max(...peaks) || 1;
      return peaks.map(p => p / maxPeak);
    } catch (err) {
      console.warn(`[aufbau-waveform] Failed to decode audio from "${url}":`, err);
      return Array(samples).fill(0.3);
    }
  }
}

AufbauWaveform.init();
