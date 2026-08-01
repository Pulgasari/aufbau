// <aufbau-audio>

import AufbauElement from './AufbauElement.js';

export class AufbauAudio extends AufbauElement {
  static get observedAttributes() {
    return ['src', 'title', 'artist', 'cover', 'layout', 'autoplay', 'loop'];
  }

  onMount() {
    this._isPlaying = false;
    this._audio = new Audio();

    // Bind native audio events to custom UI
    this._audio.addEventListener('timeupdate', () => this.syncProgress());
    this._audio.addEventListener('loadedmetadata', () => this.syncProgress());
    this._audio.addEventListener('ended', () => {
      this._isPlaying = false;
      this.updatePlayState();
    });

    this.addEventListener('click', (e) => {
      const btnPlay = e.target.closest('.btn-play');
      if (btnPlay) this.togglePlay();
    });

    this.addEventListener('input', (e) => {
      if (e.target.matches('.audio-progress')) {
        const time = (parseFloat(e.target.value) / 100) * this._audio.duration;
        if (!isNaN(time)) this._audio.currentTime = time;
      }
    });
  }

  onUnmount() {
    if (this._audio) {
      this._audio.pause();
      this._audio = null;
    }
  }

  togglePlay() {
    if (!this._audio || !this._audio.src) return;

    if (this._isPlaying) {
      this._audio.pause();
      this._isPlaying = false;
    } else {
      this._audio.play();
      this._isPlaying = true;
    }

    this.updatePlayState();
    this.emit('aufbau-audio-play', { isPlaying: this._isPlaying });
  }

  updatePlayState() {
    const icon = this.querySelector('.btn-play aufbau-icon');
    if (icon) {
      icon.setAttribute('icon', this._isPlaying ? 'lucide:pause' : 'lucide:play');
    }
  }

  syncProgress() {
    const progressInput   = this.querySelector('.audio-progress');
    const timeDisplay     = this.querySelector('.time-current');
    const durationDisplay = this.querySelector('.time-duration');

    if (this._audio && this._audio.duration) {
      const percent = (this._audio.currentTime / this._audio.duration) * 100;
      if (progressInput) progressInput.value = percent.toString();
      if (timeDisplay) timeDisplay.textContent = this.formatTime(this._audio.currentTime);
      if (durationDisplay) durationDisplay.textContent = this.formatTime(this._audio.duration);
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  update() {
    const src    = this.getAttribute('src') || '';
    const title  = this.getAttribute('title') || 'Unknown Title';
    const artist = this.getAttribute('artist') || '';
    const cover  = this.getAttribute('cover') || '';
    const layout = this.getAttribute('layout') || 'card'; // 'card' | 'compact' | 'minimal'

    if (this._audio && src !== this._audio.src) {
      this._audio.src = src;
    }

    this.innerHTML = `
      <div class="aufbau-audio-wrapper layout-${layout}">
        ${cover && layout !== 'minimal' ? `
          <div class="audio-cover">
            <img src="${cover}" alt="${title}" />
          </div>
        ` : ''}
        
        <div class="audio-details">
          <div class="audio-meta">
            <div class="audio-title">${title}</div>
            ${artist ? `<div class="audio-artist">${artist}</div>` : ''}
          </div>

          <div class="audio-controls">
            <button type="button" class="btn-play" title="Play/Pause">
              <aufbau-icon icon="lucide:play"></aufbau-icon>
            </button>

            ${layout !== 'minimal' ? `
              <div class="audio-timeline">
                <span class="time-current">0:00</span>
                <input type="range" class="audio-progress" value="0" min="0" max="100" step="0.1" />
                <span class="time-duration">0:00</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('aufbau-audio', AufbauAudio);
export default AufbauAudio;
