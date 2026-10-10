import { AufbauElement } from '@aufbau/element';

// a grid of dash-panels: as many columns of at least `min` as fit, or a fixed
// number with `columns`. a panel spans more cells with its own span and rows, never
// more columns than the board has.
//
// `sortable` reorders the panels by their header (@aufbau/gestures: on touch a long
// press lifts one first, alt + arrow moves the focused one). each move fires sort
// with { from, to, order }. `persist` keeps the order in localStorage under that
// key, by the panels' names; a board a framework renders listens to sort instead
export default class DashBoard extends AufbauElement {

  static reflect = ['sortable'];

  static attr = {
    columns  : { type: String, var: '--dash-fixed' },
    gap      : { type: String, var: '--dash-gap' },
    min      : { type: String, var: '--dash-min' },
    persist  : String,
    sortable : Boolean,
  };

  static styles = `dash-board {
    display               : grid;
    gap                   : var(--dash-gap, --space(normal));
    grid-auto-flow        : dense;
    grid-template-columns : repeat(auto-fill, minmax(min(var(--dash-min, 18rem), 100%), 1fr));

    &[columns] { grid-template-columns: repeat(var(--dash-fixed), minmax(0, 1fr)); }

    &[sortable] > dash-panel::part(header) { cursor: grab; }

    > dash-panel[data-dragging] {
      box-shadow : 0 0.5rem 1.5rem color-mix(in oklab, black 35%, transparent);
      opacity    : 0.92;

      &::part(header) { cursor: grabbing; }
    }
  }`;

  get panels () { return [...this.children].filter(child => child.localName === 'dash-panel'); }

  render () { return null; }

  onConnected () {
    this.restore();
    this.syncSortable();

    // the columns there are, so a panel never spans more of them
    this._resize = new ResizeObserver(() => this.measure());
    this._resize.observe(this);
  }

  onDisconnected () {
    this._resize?.disconnect();
    this._sort?.destroy();
    this._resize = this._sort = null;
  }

  onAttributeChanged (name) {
    if (name === 'sortable') this.syncSortable();
  }

  measure () {
    const columns = getComputedStyle(this).gridTemplateColumns.split(' ').filter(Boolean).length;
    if (columns !== this._columns) this.setVar('--dash-columns', String(this._columns = columns || 1));
  }

  // :::::: ORDER ::::::::::::::::::::::::::::::::::::::::::::::::

  // the name a panel is kept by: its name, else its id
  nameOf = panel => panel.getAttribute('name') ?? panel.id ?? '';

  get order () { return this.panels.map(this.nameOf); }

  // the panels in the stored order, the ones it does not know after them as they were
  restore () {
    const key = this.getAttr('persist');
    if (!key) return;

    let stored;
    try   { stored = JSON.parse(localStorage.getItem(key)); }
    catch { return; }
    if (!Array.isArray(stored)) return;

    const rank = name => { const index = stored.indexOf(name); return index < 0 ? stored.length : index; };
    const sorted = this.panels.map((panel, index) => ({ index, panel, rank: rank(this.nameOf(panel)) }))
      .sort((a, b) => a.rank - b.rank || a.index - b.index);

    for (const { panel } of sorted) this.append(panel);
  }

  save () {
    const key = this.getAttr('persist');
    if (!key) return;
    try   { localStorage.setItem(key, JSON.stringify(this.order)); }
    catch {}   // storage blocked
  }

  // :::::: SORTING ::::::::::::::::::::::::::::::::::::::::::::::

  async syncSortable () {
    this._sort?.destroy();
    this._sort = null;

    const token = this._sortToken = (this._sortToken ?? 0) + 1;
    if (!this.getAttr('sortable')) return;

    const { sortable } = await import('@aufbau/gestures');
    if (token !== this._sortToken || !this._mounted) return;   // superseded or unmounted

    this._sort = sortable(this, {
      handle : '[part~="header"]',
      items  : 'dash-panel',
      onSort : ({ from, to }) => {
        this.save();
        this.emit('sort', { from, order: this.order, to });
      },
    });
  }
}

DashBoard.init();
