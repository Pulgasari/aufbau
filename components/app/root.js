// <app-root>
// the frame of an app. it holds its views and areas and sets the look below it.
//
//   <app-root palette="zombie" scheme="dark" density="touch" skin="monochrome" loading>
//     <app-view name="library" route="/" active>…</app-view>
//     <app-view name="reader" route="/reader">…</app-view>
//   </app-root>
//
// with <app-area>s the root becomes a grid: the main area in the middle, the
// docked ones at start, end and bottom (area.js). root.area(name) finds one.
//
// palette, scheme, density and geometry hold for everything below the root, as
// data-* on it (tokens.css, palettes.css). the skin is one stylesheet for the
// whole document, so `skin` is set on <html> and swaps the elements' skin.
// every attribute is a property as well: root.palette = 'oled'.
//
// loading: a screen over the app until ready() is called. the default is the
// palette's background with a spinner, a child with [data-loading] replaces it.
//
// transition: the default view transition, a one-way keyframe name or none.
//
// routing: hash (default), path or none. a view with a `route` is shown when
// the address matches and puts itself into the address when it is activated.
// path takes `base`, the part of the path before the routes.
//
// events: ready, navigate { from, to }.

import './area.js';
import './view.js';

import { AufbauElement } from '@aufbau/elements/core/index.js';
import { setSkin }       from '@aufbau/elements/core/skin.js';
import { define, tagOf } from '../core/names.js';

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
    const tag = tagOf('app-root');
    const area = tagOf('app-area');
    return `${tag} {
      display: block;

      /* with areas the root is a grid: the docked ones around the main one */
      &:has(> ${area}) {
        display       : grid;
        grid-template :
          "start main   end" minmax(0, 1fr)
          "start bottom end" auto
          / auto minmax(0, 1fr) auto;
      }

      /* a bottom drawer that peeks covers the end of the app, which keeps clear of it */
      &:has(> ${area}[dock="bottom"][peek]:state(overlay)) { padding-block-end: var(--area-peek, 1.75rem); }

      &:not([loading]) > [data-loading] { display: none; }

      &[loading] > [data-loading] {
        background : var(--color-bg);
        inset      : 0;
        position   : fixed;
        z-index    : var(--app-loading-z, 1000);
      }

      /* the default screen, when there is no [data-loading] child */
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

  /** the views of this root, not those of a root inside it */
  get views () {
    const tag = tagOf('app-view');
    return [...this.querySelectorAll(tag)].filter(view => view.closest(tagOf('app-root')) === this);
  }

  get view () { return this.views.find(view => view.active) ?? null; }

  /** the areas of this root */
  get areas () { return [...this.children].filter(element => element.localName === tagOf('app-area')); }

  /** an area by its name */
  area (name) { return this.areas.find(area => area.getAttr('name') === name) ?? null; }

  /** activates a view by its name */
  show (name, options) { return this.views.find(view => view.getAttr('name') === name)?.activate(options); }

  /** ends the loading screen, faded where view transitions exist */
  ready () {
    if (!this.hasAttribute('loading')) return Promise.resolve();
    const done = () => { this.removeAttribute('loading'); this.emit('ready'); };
    if (!document.startViewTransition || reducedMotion()) return Promise.resolve(done());
    return document.startViewTransition(done).finished;
  }

  onMount () {
    // going back between hash entries fires both events, each mode listens to its own
    this.on(window, 'hashchange', () => { if (this.getAttr('routing') === 'hash') this.follow(); });
    this.on(window, 'popstate',   () => { if (this.getAttr('routing') === 'path') this.follow(); });

    // the views are upgraded by now, view.js is imported above. a view that is
    // active in the markup stays, the address wins where it names one
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

  // the skin is the document's: the token on <html> and the elements' stylesheet
  applySkin () {
    this._skinApplied = true;
    const skin = this.getAttr('skin');
    if (!skin) return;
    document.documentElement.dataset.skin = skin;
    setSkin(skin);
  }

  // :::::: ROUTING ::::::::::::::::::::::::::::::::::::::::::::::

  /** the route in the address, null without routing */
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

  /** shows the view the address names */
  follow (options = {}) {
    const path = this.path;
    if (path == null) return;
    const view = this.views.find(candidate => candidate.getAttr('route') === path);
    if (view && !view.active) view.activate({ ...options, history: false });
  }

  /** puts an activated view into the address */
  remember (view) {
    const route   = view.getAttr('route');
    const routing = this.getAttr('routing');
    if (!route || route === this.path) return;

    if (routing === 'hash') history.pushState(null, '', `#${route}`);
    if (routing === 'path') history.pushState(null, '', `${(this.getAttr('base') ?? '').replace(/\/$/, '')}${route}`);
  }
}

// every attribute is a property too, written through to the attribute
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

define('app-root', AppRoot);

export default AppRoot;
