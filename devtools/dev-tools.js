// <dev-tools>
// the panels together: a bar with a tab each, one panel open at a time, docked
// at the bottom or the top of the page, resizable, its settings remembered.
// every panel is an element of its own (panels/*.js) and works without it.

import { AufbauElement } from '@aufbau/element';
import createElement     from '@domina/methods/createElement.js';

import settings, { SPEC } from './settings.js';

import './panels/console.js';
import './panels/css.js';
import './panels/data.js';
import './panels/dom.js';
import './panels/files.js';
import './panels/settings.js';
import './panels/style.js';

const HEIGHT      = SPEC.panelHeight;
const CHROME_KEYS = new Set(['fontSize', 'panelHeight', 'position', 'wrapLines']);

export class DevTools extends AufbauElement {
  static attr = {
    panels : 'console dom css data files style settings',
  };

  get panels () {
    return Object.fromEntries([...this.querySelectorAll(':scope > [data-panel]')].map($panel => [$panel.key, $panel]));
  }

  onConnected () {
    // the stylesheet speaks of #devtools
    if (!this.id) this.id = 'devtools';
    if (!this._built) this.build();

    this.applyChrome();
    this.track(settings.subscribe(key => { if (key === null || CHROME_KEYS.has(key)) this.applyChrome(); }));
  }

  build () {
    this._built = true;

    this.append(this.handle());

    // two groups, so the menu can push one to each edge: the panel tabs, and the
    // actions that are not panels at all
    const $tabs    = createElement('li');
    const $actions = createElement('li');
    this._icons    = {};

    for (const key of this.getAttr('panels').split(/\s+/).filter(Boolean)) {
      const tag = `dev-${key}`;
      if (!customElements.get(tag)) { console.warn(`[devtools] no panel <${tag}>`); continue; }

      const $panel = createElement(tag, { hidden: true });
      this.append($panel);

      this._icons[key] = icon({ icon: customElements.get(tag).icon, title: key, 'aria-pressed': 'false', onClick: () => this.toggle(key) }, $tabs);
    }

    // picking belongs to the dom panel but is wanted from anywhere, so the menu
    // drives it and opens that panel along the way
    const $dom = this.panels.dom;
    if ($dom) {
      const $pick = icon({
        icon    : 'mdi:cursor-default-click-outline',
        title   : 'pick an element',
        'aria-pressed': 'false',
        onClick : () => { if ($dom.pick()) this.toggle('dom', true); },
      }, $actions);

      // the panel reports back, it also disarms itself once something is picked
      $dom.onPickChange = (on) => $pick.setAttribute('aria-pressed', String(on));
    }

    icon({ icon: 'mdi:reload', title: 'reload the page', onClick: () => location.reload() }, $actions);

    this.append(createElement('menu', {}, $tabs, $actions));
  }

  // one panel at a time: two open panels leave no room for the app on a phone
  toggle (key, force) {
    const panels = this.panels;
    const $panel = panels[key];
    if (!$panel) return this;

    const open = force ?? $panel.hidden;

    for (const [other, $other] of Object.entries(panels)) if (other !== key) $other.hidden = true;
    $panel.hidden = !open;

    for (const [name, $icon] of Object.entries(this._icons)) $icon.setAttribute('aria-pressed', String(!panels[name].hidden));
    return this;
  }

  // the settings that change the shape ride as custom properties and data
  // attributes, devtools.css decides what they mean
  applyChrome () {
    this.style.setProperty('--dt-height', `${settings.get('panelHeight')}dvh`);
    this.style.setProperty('--dt-font',   `${settings.get('fontSize')}px`);
    this.dataset.wrap     = settings.get('wrapLines') ? 'on' : 'off';
    this.dataset.position = settings.get('position');
  }

  /*
  the handle is the first child, which puts it on whichever end faces the app:
  last in a normal column, first in the reversed one the top position uses.
  css hides it while no panel is open, since there is then nothing to resize.

  dragging writes --dt-height straight onto the element for the duration and only
  commits to the settings on release, a store write per pointermove would persist
  to localStorage sixty times a second for one gesture.
  */
  handle () {
    const $handle = createElement('div', {
      title         : 'drag to resize',
      role          : 'separator',
      'aria-label'  : 'panel height',
      onPointerDown : (event) => {
        const $open = this.querySelector(':scope > [data-panel]:not([hidden])');
        if (!$open) return;

        const startY = event.clientY;
        const startH = $open.getBoundingClientRect().height / innerHeight * 100;
        let   height = settings.get('panelHeight');

        $handle.setPointerCapture(event.pointerId);

        const onMove = (move) => {
          // at the bottom the panel grows upwards, at the top downwards
          const delta = (this.dataset.position === 'top' ? 1 : -1) * (move.clientY - startY);

          height = Math.min(HEIGHT.max, Math.max(HEIGHT.min, Math.round((startH + delta / innerHeight * 100) / HEIGHT.step) * HEIGHT.step));
          this.style.setProperty('--dt-height', `${height}dvh`);
        };

        const onUp = () => {
          $handle.removeEventListener('pointermove', onMove);
          $handle.removeEventListener('pointerup', onUp);
          $handle.removeEventListener('pointercancel', onUp);
          settings.set('panelHeight', height);
        };

        $handle.addEventListener('pointermove', onMove);
        $handle.addEventListener('pointerup', onUp);
        $handle.addEventListener('pointercancel', onUp);
      },
    });

    return $handle;
  }
}

function icon (props, group) {
  const $icon = createElement('svg-icon', { role: 'button', tabIndex: 0, ...props });
  group.append($icon);
  return $icon;
}

DevTools.init();

export default DevTools;
