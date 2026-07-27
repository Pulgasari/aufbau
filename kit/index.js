// @aufbau/kit

// ::: PREACT + HTM
import { render, h, Component, Fragment, createContext, cloneElement } from 'preact';
import { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'preact/hooks';
import { signal, computed, effect, batch, useSignal, useComputed, useSignalEffect } from '@preact/signals';   
import htm from 'htm'; export const html = htm.bind(h); //window.html = html;
export {
  render, h, Component, Fragment, createContext, cloneElement,
  useState, useEffect, useMemo, useCallback, useRef, useContext,
  signal, computed, effect, batch, useSignal, useComputed, useSignalEffect
};

// ::: AUFBAU
import cache           from '@aufbau/cache';
import importeur       from '@aufbau/import';
import * as shaders    from '@aufbau/shaders';
import * as stylesheet from '@aufbau/stylesheet';
import { observeStylesheets }       from '@aufbau/plugins/client';
import { interceptFetchStylesheet } from '@aufbau/plugins/worker';

// Default Import Map configuration
const DEFAULT_IMPORT_MAP = {
  "preact"          : "https://esm.sh/preact@10.22.0",
  "preact/hooks"    : "https://esm.sh/preact@10.22.0/hooks",
  "@preact/signals" : "https://esm.sh/@preact/signals@1.3.0",
  "htm"             : "https://esm.sh/htm@3.1.1"
};

// :::::: DOM PROPERTY & DATASET HELPERS

const root = typeof document !== 'undefined' ? document.documentElement : null;
const prefixed = (str, prefix) => (str.startsWith(prefix) ? str : prefix + str);
const toWords = (str) => str.replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/[-_.\s]+/g, ' ').trim().toLowerCase().split(' ').filter(Boolean);
const toCamelCase = (str) => toWords(str).map((word, i) => (i === 0 ? word : word[0].toUpperCase() + word.slice(1))).join('');
const toKebabCase = (str) => toWords(str).join('-');

const definitions = new Map();

/**
 * Registers a property or dataset mapping key
 * @param {Object} options
 * @param {string} options.key
 * @param {HTMLElement} [options.target]
 * @param {'dataset'|'property'} options.type
 */
export function define({ key, target, type }) {
  const camelKey = toCamelCase(key);
  target ??= root;
  definitions.set(camelKey, { target, type });
}

/**
 * Updates a registered property or dataset key
 * @param {Object} options
 * @param {string} options.key
 * @param {any} options.value
 * @param {HTMLElement} [options.target]
 */
export function update({ key, value, target }) {
  const camelKey = toCamelCase(key);
  const { type } = definitions.get(camelKey) ?? {};
  if (type === 'dataset') updateDataset({ key: camelKey, value, target });
  if (type === 'property') updateProperty({ key: camelKey, value, target });
}

/**
 * Updates a CSS custom property on the target element
 * @param {Object} options
 * @param {string} options.key
 * @param {any} options.value
 * @param {HTMLElement} [options.target]
 */
export function updateProperty({ key, value, target }) {
  const kebabKey = prefixed(toKebabCase(key), '--');
  const el = target || root;
  if (el) el.style.setProperty(kebabKey, value);
}

/**
 * Updates a dataset attribute on the target element
 * @param {Object} options
 * @param {string} options.key
 * @param {any} options.value
 * @param {HTMLElement} [options.target]
 */
export function updateDataset({ key, value, target }) {
  const camelKey = toCamelCase(key);
  const el = target || root;
  if (el) el.dataset[camelKey] = value;
}



/**
 * Automatically injects or extends the browser's <script type="importmap"> tag
 * @param {Record<string, string>} [customImports={}]
 */
export function injectImportMap (customImports = {}) {
  if (typeof document === 'undefined') return;

  let script = document.querySelector('script[type="importmap"]');
  const mergedImports = { ...DEFAULT_IMPORT_MAP, ...customImports };

  if (!script) {
    script = document.createElement('script');
    script.type = 'importmap';
    script.textContent = JSON.stringify({ imports: mergedImports }, null, 2);
    document.head.prepend(script);
  } else {
    try {
      const existingMap = JSON.parse(script.textContent || '{}');
      existingMap.imports = { ...DEFAULT_IMPORT_MAP, ...existingMap.imports, ...customImports };
      script.textContent = JSON.stringify(existingMap, null, 2);
    } catch (e) {
      console.warn('[@aufbau/kit] Failed to parse existing importmap:', e);
    }
  }
}

// Internal Kit Configuration State
export const configs = {
  autoClient    : true,
  autoImportMap : true,
  imports       : {}
};

/**
 * Configure global Aufbau settings
 * @param {Partial<typeof configState>} options
 */
export function config (options = {}) {
  Object.assign(configState, options);

  if (configState.autoImportMap && options.imports) {
    injectImportMap(configState.imports);
  }

  return configState;
}

/**
 * Bootstraps an Aufbau application
 * @param {import('preact').ComponentChild} Component
 * @param {HTMLElement} [container=document.body]
 */
export function createApp (Component, container = document.body) {
  if (typeof window !== 'undefined') {
    if (configState.autoImportMap) {
      injectImportMap(configState.imports);
    }

    if (configState.autoClient) {
      import('@aufbau/stylesheet/plugins/client.js').then(({ initAufbauClient }) => {
        initAufbauClient();
      });
    }
  }

  return render(Component, container);
}
/*
export function init () {
  if (typeof window !== 'undefined') {
    import('@aufbau/stylesheet/plugins/client.js').then(({ initAufbauClient, observeDom }) => { initAufbauClient(); observeDom(); });
  }
}
*/

/**
 * Initializes the Aufbau runtime in the browser out-of-the-box.
 */
export function init() {
  if (typeof window !== 'undefined') {
    observeStylesheets();
  }
}



export * from '@aufbau/plugins/worker';

/**
 * Combined master fetch handler for Service Workers.
 * Checks all registered Aufbau plugins in sequence.
 * 
 * @param {FetchEvent} event
 * @returns {Promise<Response>|null}
 */
export async function interceptFetch (event) {
  // 1. Check stylesheet plugin
  const stylesheetResponse = await handleStylesheetFetch(event);
  if (stylesheetResponse) return stylesheetResponse;
  return null;
}

/**
 * Central Aufbau Singleton Instance
 */
export const aufbau = {
  // AUFBAU
  config, configs, 
  init, interceptFetch,
  cache, import: importeur,
  createApp, injectImportMap,
  shaders, stylesheet,
  define, update, updateDataset, updateProperty,

  // Preact + HTM
  render, cloneElement, createContext, Component,
  useCallback, useContext, useEffect, useMemo, useState, useRef,
  batch, computed, effect, signal, useComputed, useSignal, useSignalEffect,   
  h, html,
};

export default aufbau;
