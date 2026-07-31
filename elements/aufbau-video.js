import { AufbauElement } from './AufbauElement.js';

export class AufbauVideo extends AufbauElement {
  static get observedAttributes() {
    return ['src', 'youtube-id', 'poster', 'controls', 'autoplay', 'loop', 'muted'];
  }

  update() {
    const youtubeId   = this.getAttribute('youtube-id');
    const src         = this.getAttribute('src');
    const poster      = this.getAttribute('poster')   || '';
    const hasControls = this.hasAttribute('controls') || true;

    if (youtubeId) {
      this.innerHTML = `
        <div class="aufbau-video-container aspect-16-9">
          <iframe 
            src="https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0" 
            title="Video player" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
      `;
    } else if (src) {
      this.innerHTML = `
        <div class="aufbau-video-container">
          <video 
            src="${src}" 
            ${poster ? `poster="${poster}"` : ''} 
            ${hasControls ? 'controls' : ''} 
            ${this.hasAttribute('autoplay') ? 'autoplay' : ''} 
            ${this.hasAttribute('loop')     ? 'loop'     : ''} 
            ${this.hasAttribute('muted')    ? 'muted'    : ''}>
          </video>
        </div>
      `;
    }
  }
}

customElements.define('aufbau-video', AufbauVideo);
