// <aufbau-audio>

import { AufbauElement } from './core/AufbauCore.js';

const formatTime = (seconds) => {
  if (Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default class AufbauAudio extends AufbauElement {
  
  static attr = {
    src      : String,
    title    : 'Unknown Title',
    artist   : String,
    cover    : String, 
    layout   : 'card', 
    autoplay : false, 
    loop     : false,
  ];

  onMount () {
    this._isPlaying = false;
    this._audio = new Audio();

    this._audio.addEventListener('timeupdate',     () => this.syncProgress());
    this._audio.addEventListener('loadedmetadata', () => this.syncProgress());
    this._audio.addEventListener('ended', () => {
      this._isPlaying = false;
      this.updatePlayState();
    });

    this.on('click', (e) => {
      if (e.target.closest('.btn-play')) this.togglePlay();
    });

    this.on('input', (e) => {
      if (!e.target.matches('.audio-progress')) return;
      const time = (parseFloat(e.target.value) / 100) * this._audio.duration;
      if (!Number.isNaN(time)) this._audio.currentTime = time;
    });
  }

  onUnmount () {
    this._audio?.pause();
    this._audio = null;
  }

  togglePlay () {
    if (!this._audio?.src) return;

    this._isPlaying = !this._isPlaying;
    this._isPlaying ? this._audio.play() : this._audio.pause();

    this.updatePlayState();
    this.emit('aufbau-audio-play', { isPlaying: this._isPlaying });
  }

  updatePlayState () {
    this.$('.btn-play aufbau-icon')
      ?.setAttribute('icon', this._isPlaying ? 'lucide:pause' : 'lucide:play');
  }

  syncProgress () {
    if (!this._audio?.duration) return;

    const { audioProgress, timeCurrent, timeDuration } = this.$;
    const percent = (this._audio.currentTime / this._audio.duration) * 100;

    if (audioProgress) audioProgress.value       = percent.toString();
    if (timeCurrent)   timeCurrent.textContent   = formatTime(this._audio.currentTime);
    if (timeDuration)  timeDuration.textContent  = formatTime(this._audio.duration);
  }

  update () {
    const { artist, cover, layout, src, title } = this.getAttr();

    if (this._audio && src !== this._audio.src) this._audio.src = src;

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
                <span id="time-current">0:00</span>
                <input type="range" id="audio-progress" value="0" min="0" max="100" step="0.1" />
                <span id="time-duration">0:00</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
}

AufbauAudio.init();
