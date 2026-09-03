// <aufbau-toc>

import { AufbauElement } from './core/index.js';
import { html }    from './core/html.js';
import { toSlug }  from '@pulgasari/str';
import * as dom from '@domina/core';

export default class AufbauToc extends AufbauElement {
  static attr = {
    target   : String,
    selector : 'h1, h2, h3, h4, h5, h6',
    title    : 'On This Page'
  };

  onMount () {
    this.watch();
  }

  onAttributeChange () {
    this.watch();
  }

  /** re-collects whenever headings appear or disappear inside the target */
  watch () {
    this._stopWatching?.();
    this._stopWatching = null;

    const { target, selector } = this.getAttr();
    const container = target ? dom.getElement(target) : null;
    if (!container) return;

    const rescan = () => this.invalidate().update();

    this._stopWatching = this.track(dom.observe(selector, {
      within    : container,
      onInit    : rescan,
      onAdded   : rescan,
      onRemoved : rescan,
    }));
  }

  /** headings need stable ids to be linkable, so they get one if missing */
  collect () {
    const { target, selector } = this.getAttr();
    const container = target ? dom.getElement(target) : null;
    if (!container) return [];

    return dom.getElements(selector, container).map((el, index) => {
      const text  = el.textContent?.trim() || '';
      const level = Number(/^H([1-6])$/i.exec(el.tagName)?.[1] ?? el.dataset.level ?? 1);

      if (!el.id) el.id = toSlug(text) || `heading-${index}`;

      return { id: el.id, text, level };
    });
  }

  render () {
    const { title } = this.getAttr();
    const items = this.collect();
    if (!items.length) return '';

    return html`
      <nav class="docs-toc-nav">
        <h4>${title}</h4>
        <ul>
          ${items.map(item => html`
            <li class="toc-level-${item.level}"><a href="#${item.id}">${item.text}</a></li>
          `)}
        </ul>
      </nav>
    `;
  }
}

AufbauToc.init();
