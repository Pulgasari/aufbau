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
    let timer = null;

    this.on('aufbau-input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => this.applyFilter(e.detail.value), this.getAttr('debounce'));
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
