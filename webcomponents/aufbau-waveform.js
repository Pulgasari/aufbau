import { AufbauElement } from './AufbauElement.js';

let sharedAudioCtx = null;
function getAudioContext() {
  if (!sharedAudioCtx && typeof window !== 'undefined') {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

export class AufbauWaveform extends AufbauElement {
  static get observedAttributes() {
    return ['src', 'bars', 'progress', 'interactive'];
  }

  onMount() {
    this.addEventListener('click', (e) => {
      if (!this.hasAttribute('interactive')) return;

      const rect = this.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progressPercent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));

      this.setAttribute('progress', progressPercent.toString());
      this.emit('aufbau-waveform-seek', { progress: progressPercent });
    });
  }

  async update() {
    const src = this.getAttribute('src');
    const barCount = parseInt(this.getAttribute('bars') || '40', 10);
    const progress = parseFloat(this.getAttribute('progress') || '0');

    if (src && src !== this._loadedSrc) {
      this._loadedSrc = src;
      this._barPeaks = await this.fetchAndDecodePeaks(src, barCount);
    }

    const peaks = this._barPeaks || Array(barCount).fill(0.2);

    this.innerHTML = `
      <div class="aufbau-waveform-wrapper">
        ${peaks.map((heightPercent, index) => {
          const barProgress = (index / barCount) * 100;
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

  async fetchAndDecodePeaks(url, samples) {
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

customElements.define('aufbau-waveform', AufbauWaveform);
