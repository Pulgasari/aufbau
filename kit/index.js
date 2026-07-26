// @aufbau/kit

// ::: PREACT + HTM
export { render, h, Component, createContext, cloneElement } from 'preact';
export { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'preact/hooks';
export { signal, computed, effect, batch, useSignal, useComputed, useSignalEffect } from '@preact/signals';   
import { h } from 'preact'; import htm from 'htm'; export const html = htm.bind(h);

// ::: AUFBAU
export * from '@aufbau/shaders';
export * from '@aufbau/stylesheet';

/**
 * Convenience App-Booster: Initialisiert den Aufbau-Client & rendert die App
 * @param {import('preact').ComponentChild} Component - Root Preact Element
 * @param {HTMLElement} [container=document.body] - Target Container
 */
export function createApp (Component, container = document.body) {
  if (typeof window !== 'undefined') {
    // Stylesheet-Prozessor aktivieren
    import('@aufbau/stylesheet/plugins/client.js').then(({ initAufbauClient }) => {
      initAufbauClient();
    });
  }

  return render(Component, container);
}
