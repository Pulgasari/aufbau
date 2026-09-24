// <aufbau-toc>
// table of contents for the headings inside `target`. the host is the
// navigation landmark, its children are the visible label and one list.
// every entry carries its heading level as aria-level, which is also the
// styling hook for indentation. the entry of the heading currently read is
// marked with aria-current="location".

import { AufbauElement } from './core/index.js';
import { html }          from './core/html.js';

import { toSlugCase }  from '@pulgasari/str';
import { getElement }  from '@domina/methods/getElement.js';
import { getElements } from '@domina/methods/getElements.js';
import { observe }     from '@domina/observer';

export default class AufbauToc extends AufbauElement {
  static attr = {
    label    : 'On This Page',
    selector : 'h1, h2, h3, h4, h5, h6',
    target   : String,
  };

  static styles = `aufbau-toc {
    display: block;

    > ol {
      list-style : none;
      margin     : 0;
      padding    : 0;
    }

    li {
      padding-inline-start: calc((var(--toc-level, 1) - 1) * var(--toc-indent, 0.75rem));

      &[aria-level="2"] { --toc-level: 2; }
      &[aria-level="3"] { --toc-level: 3; }
      &[aria-level="4"] { --toc-level: 4; }
      &[aria-level="5"] { --toc-level: 5; }
      &[aria-level="6"] { --toc-level: 6; }
    }
  }`;

  constructor () {
    super();
    this._internals = this.attachInternals?.() ?? null;
    if (this._internals) this._internals.role = 'navigation';
  }

  get container () {
    const { target } = this.getAttr();
    return target ? getElement(target) : null;
  }

  onMount () { this.watch(); }

  onAttributeChange (name) {
    if (name === 'target' || name === 'selector') this.watch();
  }

  /** re-collects whenever headings appear or disappear inside the target */
  watch () {
    this._stopWatching?.();
    this._stopWatching = null;

    const container = this.container;
    if (!container) return;

    // the observer reports every heading on its own, a burst collapses into one rebuild
    const rescan = () => {
      if (this._rescanQueued) return;
      this._rescanQueued = true;
      queueMicrotask(() => { this._rescanQueued = false; this.invalidate().update(); });
    };

    this._stopWatching = this.track(observe(this.getAttr('selector'), {
      within    : container,
      onInit    : rescan,
      onAdded   : rescan,
      onRemoved : rescan,
    }));
  }

  /** headings need stable, unique ids to be linkable, so they get one if missing */
  collect () {
    const container = this.container;
    if (!container) return [];

    const taken = new Set;

    return getElements(this.getAttr('selector'), container).map((heading, index) => {
      const text  = heading.textContent?.trim() || '';
      const level = Number(/^H([1-6])$/i.exec(heading.tagName)?.[1] ?? heading.dataset.level ?? 1);

      if (!heading.id) {
        const base = toSlugCase(text) || `heading-${index}`;
        let id = base;
        for (let n = 2; taken.has(id) || document.getElementById(id); n++) id = `${base}-${n}`;
        heading.id = id;
      }
      taken.add(heading.id);

      return { heading, id: heading.id, level, text };
    });
  }

  render () {
    this._entries = this.collect();
    if (!this._entries.length) return '';

    return html`
      <header>${this.getAttr('label')}</header>
      <ol>
        ${this._entries.map(entry => html`
          <li aria-level="${entry.level}"><a href="#${entry.id}">${entry.text}</a></li>
        `)}
      </ol>
    `;
  }

  // the list is new, so the spy has to follow it
  onRender () { this.spy(); }

  sync () {
    if (this._internals) this._internals.ariaLabel = this.getAttr('label');
  }

  // marks the entry of the topmost heading in view. headings that leave keep
  // their mark until another one arrives, so scrolling through a long section
  // does not leave the list without a current entry
  spy () {
    this._stopSpy?.();

    const entries = this._entries ?? [];
    if (!entries.length || typeof IntersectionObserver === 'undefined') return;

    const visible = new Set;
    const links   = new Map(entries.map(entry => [entry.heading, this.$(`a[href="#${CSS.escape(entry.id)}"]`)]));

    const observer = new IntersectionObserver((records) => {
      for (const record of records) visible[record.isIntersecting ? 'add' : 'delete'](record.target);

      const current = entries.find(entry => visible.has(entry.heading));
      if (!current) return;

      for (const [heading, link] of links) {
        if (heading === current.heading) link?.setAttribute('aria-current', 'location');
        else link?.removeAttribute('aria-current');
      }
    }, { rootMargin: '0px 0px -60% 0px' });

    for (const entry of entries) observer.observe(entry.heading);
    this._stopSpy = this.track(() => observer.disconnect());
  }
}

AufbauToc.init();
