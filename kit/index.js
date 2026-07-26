// @aufbau/kit

// ::: PREACT + HTM
import { render, h, Component, createContext, cloneElement } from 'preact';
import { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'preact/hooks';
import { signal, computed, effect, batch, useSignal, useComputed, useSignalEffect } from '@preact/signals';   
import { h } from 'preact'; import htm from 'htm'; export const html = htm.bind(h);
export {
  render, h, Component, createContext, cloneElement,
  useState, useEffect, useMemo, useCallback, useRef, useContext,
  signal, computed, effect, batch, useSignal, useComputed, useSignalEffect
};

// ::: AUFBAU
import cache     from '@aufbau/cache';
import importeur from '@aufbau/import';
export *         from '@aufbau/shaders';
export *         from '@aufbau/stylesheet';

// Default Import Map configuration
const DEFAULT_IMPORT_MAP = {
  "preact"          : "https://esm.sh/preact@10.22.0",
  "preact/hooks"    : "https://esm.sh/preact@10.22.0/hooks",
  "@preact/signals" : "https://esm.sh/@preact/signals@1.3.0",
  "htm"             : "https://esm.sh/htm@3.1.1"
};

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

/**
 * Central Aufbau Singleton Instance
 */
export const aufbau = {
  // AUFBAU
  config, configs,
  cache, import: importeur,
  createApp, injectImportMap,
  shaders, stylesheet,

  // Preact + HTM
  render, cloneElement, createContext, Component,
  useCallback, useContext, useEffect, useMemo, useState, useRef,
  batch, computed, effect, signal, useComputed, useSignal, useSignalEffect,   
  h, html,
};

export default aufbau;
