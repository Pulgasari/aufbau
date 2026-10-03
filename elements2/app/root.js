import './area.js';
import './view.js';

import { AufbauElement } from '../base/index.js';
import { setSkin }       from '../lib/skin.js';

// set on the root as data-*, the css below it reads them
const LOOK = ['density', 'geometry', 'palette', 'scheme'];

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export class AppRoot extends AufbauElement {

  static attr = {
    base       : String,
    density    : String,
    geometry   : String,
    loading    : Boolean,
    palette    : String,
    routing    : { type: String, default: 'hash', values: ['hash', 'none', 'path'] },
    scheme     : String,
    skin       : String,
    transition : { type: String, default: 'fade' },
  };

  static styles () {
    return `app-root {
      display: block;

      &:has(> app-area) {
        display       : grid;
        grid-template :
          "start main   end" minmax(0, 1fr)
          "start bottom end" auto
          / auto minmax(0, 1fr) auto;
      }

      &:has(> app-area[dock="bottom"][peek]:state(overlay)) { padding-block-end: var(--area-peek, 1.75rem); }

      &:not([loading]) > [data-loading] { display: none; }

      &[loading] > [data-loading] {
        background : var(--color-bg);
        inset      : 0;
        position   : fixed;
        z-index    : var(--app-loading-z, 1000);
      }

      &[loading]:not(:has(> [data-loading]))::before,
      &[loading]:not(:has(> [data-loading]))::after {
        content  : '';
        position : fixed;
        z-index  : var(--app-loading-z, 1000);
      }

      &[loading]:not(:has(> [data-loading]))::before {
        background : var(--color-bg);
        inset      : 0;
      }

      &[loading]:not(:has(> [data-loading]))::after {
        animation        : spin 0.8s linear infinite;
        block-size       : 2em;
        border           : 2px solid var(--color-ink);
        border-radius    : 50%;
        border-top-color : transparent;
        inline-size      : 2em;
        inset            : calc(50% - 1em) auto auto calc(50% - 1em);
      }
    }`;
  }

  // the views of this root, not those of a root inside it
  get views () {
    return [...this.querySelectorAll('app-view')].filter(view => view.closest('app-root') === this);
  }

  get view () { return this.views.find(view => view.active) ?? null; }

  // the areas of this root
  get areas () { return [...this.children].filter(element => element.localName === 'app-area'); }

  // an area by its name
  area (name) { return this.areas.find(area => area.getAttr('name') === name) ?? null; }

  // activates a view by its name
  show (name, options) { return this.views.find(view => view.getAttr('name') === name)?.activate(options); }

  ready () {
    if (!this.hasAttribute('loading')) return Promise.resolve();
    const done = () => { this.removeAttribute('loading'); this.emit('ready'); };
    if (!document.startViewTransition || reducedMotion()) return Promise.resolve(done());
    return document.startViewTransition(done).finished;
  }

  onMount () {
    this.on(window, 'hashchange', () => { if (this.getAttr('routing') === 'hash') this.follow(); });
    this.on(window, 'popstate',   () => { if (this.getAttr('routing') === 'path') this.follow(); });

    this.follow({ transition: false });
    if (!this.view) this.views[0]?.activate({ history: false, transition: false });
  }

  onAttributeChange (name) {
    if (name === 'skin') this.applySkin();
  }

  sync () {
    for (const name of LOOK) {
      const value = this.getAttr(name);
      if (value) this.dataset[name] = value;
      else delete this.dataset[name];
    }
    if (!this._skinApplied) this.applySkin();
  }

  applySkin () {
    this._skinApplied = true;
    const skin = this.getAttr('skin');
    if (!skin) return;
    document.documentElement.dataset.skin = skin;
    setSkin(skin);
  }

  // :::::: ROUTING ::::::::::::::::::::::::::::::::::::::::::::::

  // the route in the address, null without routing
  get path () {
    const routing = this.getAttr('routing');
    if (routing === 'hash') return location.hash.slice(1) || '/';
    if (routing === 'path') {
      const base = (this.getAttr('base') ?? '').replace(/\/$/, '');
      const path = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : location.pathname;
      return path || '/';
    }
    return null;
  }

  // shows the view the address names
  follow (options = {}) {
    const path = this.path;
    if (path == null) return;
    const view = this.views.find(candidate => candidate.getAttr('route') === path);
    if (view && !view.active) view.activate({ ...options, history: false });
  }

  // puts an activated view into the address
  remember (view) {
    const route   = view.getAttr('route');
    const routing = this.getAttr('routing');
    if (!route || route === this.path) return;

    if (routing === 'hash') history.pushState(null, '', `#${route}`);
    if (routing === 'path') history.pushState(null, '', `${(this.getAttr('base') ?? '').replace(/\/$/, '')}${route}`);
  }
}

for (const name of Object.keys(AppRoot.attr)) {
  const attribute = name;
  Object.defineProperty(AppRoot.prototype, name, {
    configurable : true,
    get () { return this.getAttr(attribute); },
    set (value) {
      if (value === false || value == null) this.removeAttribute(attribute);
      else this.setAttribute(attribute, value === true ? '' : String(value));
    },
  });
}

AppRoot.init('app-root');

export default AppRoot;
