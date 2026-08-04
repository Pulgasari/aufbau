// <aufbau-loop>

import { AufbauElement } from './core/index.js';

export default class AufbauLoop extends AufbauElement {
  static attr = ['mode', 'interval', 'speed', 'pause-on-hover', 'direction'];

  onMount() {
    this._currentIndex = 0;
    // Preserve original child elements before component mutations
    if (!this._originalItems) this._originalItems = Array.from(this.children).map(child => child.cloneNode(true));
    this.setupLoop();
  }

  onUnmount         () { this.stopLoop(); }
  onAttributeChange () { this.setupLoop(); }

  stopLoop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  setupLoop() {
    this.stopLoop();

    const { mode = 'carousel' } = this.getAttr();
    const interval     = parseInt(this.getAttr('interval') || '3000', 10);
    const pauseOnHover = this.hasAttribute('pause-on-hover');

    if (mode === 'carousel' && this._originalItems?.length > 1) {
      this._timer = setInterval(() => this.nextStep(), interval);
    }

    if (pauseOnHover) {
      this.on('mouseenter', () => this.stopLoop());
      this.on('mouseleave', () => this.setupLoop());
    }
  }

  nextStep() {
    if (!this._originalItems || !this._originalItems.length) return;
    this._currentIndex = (this._currentIndex + 1) % this._originalItems.length;
    this.renderCarousel();
  }

  renderCarousel() {
    const track = this.$('.loop-track'); if (!track) return;

    const items = track.children;
    for (let i = 0; i < items.length; i++) {
      items[i].classList.toggle('is-active', i === this._currentIndex);
    }
    this.emit('aufbau-loop-change', { index: this._currentIndex });
  }

  update() {
    const { direction = 'left', mode = 'carousel', speed ='20s' } = this.getAttr() || ''; // 'carousel' | 'marquee'    
    if (!this._originalItems || !this._originalItems.length) {
      this._originalItems = Array.from(this.children).map(child => child.cloneNode(true));
    }

    if (mode === 'marquee') {
      // Marquee mode duplicates content for seamless continuous animation
      this.innerHTML = `
        <div class="aufbau-loop-wrapper mode-marquee dir-${direction}">
          <div class="marquee-track" style="animation-duration: ${speed};">
            <div class="marquee-content"></div>
            <div class="marquee-content" aria-hidden="true"></div>
          </div>
        </div>
      `;

      this.$$('.marquee-content').forEach(container => {
        this._originalItems.forEach(item => container.appendChild(item.cloneNode(true)));
      });
    } else {
      // Step / Carousel mode
      this.innerHTML = `
        <div class="aufbau-loop-wrapper mode-carousel">
          <div class="loop-track"></div>
        </div>
      `;

      const track = this.$('.loop-track');
      this._originalItems.forEach((item, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = `loop-item ${index === this._currentIndex ? 'is-active' : ''}`;
        wrapper.appendChild(item.cloneNode(true);
        track.appendChild(wrapper);
      });
    }
  }
}

AufbauLoop.init();
