import { AufbauElement } from '../base/index.js';
import { attrs, html }   from '../lib/html.js';

export default class AufbauCrumbs extends AufbauElement {
  static internals = { role: 'navigation' };

  static attr = {
    href      : String,   // link template, {path} is replaced
    label     : 'breadcrumb',
    max       : Number,
    path      : String,
    root      : String,
    separator : '/',
  };

  static styles = `aufbau-crumbs {
    align-items : center;
    display     : flex;
    flex-wrap   : nowrap;
    gap         : var(--crumbs-gap, 0.35em);
    min-inline-size : 0;
    overflow    : hidden;

    > * {
      flex            : 0 1 auto;
      min-inline-size : 0;
      overflow        : hidden;
      text-overflow   : ellipsis;
      white-space     : nowrap;
    }

    > :last-child { flex-shrink: 0.2; }

    > * + *::before {
      content      : var(--crumbs-separator, '/');
      margin-inline-end : var(--crumbs-gap, 0.35em);
      opacity      : 0.5;
    }

    > button {
      background : none;
      border     : 0;
      color      : inherit;
      cursor     : pointer;
      font       : inherit;
      margin     : 0;
      padding    : 0;
    }
  }`;

  get crumbs () {
    const { path, root, separator } = this.getAttr();
    if (path == null) return [];

    const names  = String(path).split(separator).filter(Boolean);
    const lead   = String(path).startsWith(separator) ? separator : '';
    const crumbs = names.map((label, index) => ({ label, path: lead + names.slice(0, index + 1).join(separator) }));

    return root ? [{ label: root, path: lead || separator }, ...crumbs] : crumbs;
  }

  onMount () {
    this.on('click', 'button[data-path]', (event, button) => {
      const index = Number(button.dataset.index);
      this.emit('aufbau-crumbs', { index, path: button.dataset.path });
    });

    this.on('click', 'button[data-expand]', () => { this._expanded = true; this.update(); });

    const observer = new MutationObserver(() => this.sync());
    observer.observe(this, { childList: true });
    this.track(() => observer.disconnect());
  }

  onAttributeChange (name) { if (name === 'path') this._expanded = false; }

  render () {
    if (this.getAttr('path') == null) return null;

    const { href, max } = this.getAttr();
    const crumbs = this.crumbs;
    const last   = crumbs.length - 1;

    const collapse = max > 1 && crumbs.length > max && !this._expanded;
    const shown    = collapse ? [crumbs[0], null, ...crumbs.slice(crumbs.length - (max - 1))] : crumbs;

    const crumb = (entry) => {
      if (!entry) return html`<button type="button" data-expand aria-label="show full path">…</button>`;

      const index = crumbs.indexOf(entry);
      if (index === last) return html`<span aria-current="page">${entry.label}</span>`;
      if (href) return html`<a href="${href.replaceAll('{path}', encodeURIComponent(entry.path))}">${entry.label}</a>`;
      return html`<button type="button" ${attrs({ 'data-index': index, 'data-path': entry.path })}>${entry.label}</button>`;
    };

    return html`${shown.map(crumb)}`;
  }

  sync () {
    if (this.internals) this.internals.ariaLabel = this.getAttr('label');

    if (this.getAttr('path') != null) return;
    const crumbs = [...this.children];
    crumbs.forEach((crumb, index) => {
      if (index === crumbs.length - 1) { if (!crumb.hasAttribute('aria-current')) crumb.setAttribute('aria-current', 'page'); }
      else if (crumb.getAttribute('aria-current') === 'page') crumb.removeAttribute('aria-current');
    });
  }
}

AufbauCrumbs.init();
