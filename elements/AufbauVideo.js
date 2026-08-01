// <aufbau-video>

import AufbauElement from './AufbauElement.js';

export default class AufbauVideo extends AufbauElement {
  static attr = {
    src       : String,
    youtubeId : String,
    poster    : String,
    controls  : true,
    autoplay  : Boolean,
    loop      : Boolean,
    muted     : Boolean
  };

  update () {
    const { src, youtubeId, poster, controls, autoplay, loop, muted } = this.getAttr();

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
            ${controls ? 'controls' : ''} 
            ${autoplay ? 'autoplay' : ''} 
            ${loop ? 'loop' : ''} 
            ${muted ? 'muted' : ''}>
          </video>
        </div>
      `;
    }
  }
}

AufbauVideo.init();
