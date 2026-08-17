// <aufbau-filter>

import { AufbauElement } from './core/index.js';
import * as dom from '@domina/core';
import { html } from '@aufbau/js';

export default class AufbauFilter extends AufbauElement {
  static attr = {
    placeholder   : 'Filter...',
    target        : String,
    container     : String,
    mode          : { 
      type: String, 
      default: 'contains',
      values: ['contains', 'startsWith', 'endsWith', 'exact']
    },
    mismatchClass : 'is-filtered-out',
    debounce      : 100
  };

  onMount () {
    // the handle has to live on the instance so onUnmount can clear it —
    // a local `let timer` left this._timer undefined and the cleanup a no-op,
    // so a pending debounce still fired applyFilter() after disconnect
    this.on('aufbau-input', (e) => {
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.applyFilter(e.detail.value), this.getAttr('debounce'));
    });

    this.on('aufbau-filter-reset', () => this.applyFilter(''));
  }

  onUnmount () { clearTimeout(this._timer); }

  applyFilter (query) {
    const { target, container, mode, mismatchClass } = this.getAttr();
    if (!target) return;

    // container defaults to the closest shared ancestor of the targets, document
    // is the safe fallback when none is configured
    const result = dom.filterElements({
      container : container || document,
      item      : target,
      filters   : [['', query, mode]],
      mismatchClass
    });

    this.emit('aufbau-filter', { query, ...result });
  }

  render () {
    const { placeholder } = this.getAttr();
    return html`<aufbau-input type="search" placeholder="${placeholder}"></aufbau-input>`;
  }
}

AufbauFilter.init();
