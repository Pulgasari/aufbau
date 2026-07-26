// @aufbau/stylesheet/dev/index.d.ts

export interface TransformOptions {
  dev?: boolean;
}

export interface BrowserInitOptions {
  useWorker?: boolean;
  workerPath?: string;
}

/**
 * Transforms Aufbau CSS code into standard browser-compliant CSS.
 */
export default function transform(code: string): string;

/**
 * Registers the Aufbau Service Worker for intercepting .aufbau.css and .ass files.
 */
export function registerServiceWorker(swPath?: string): Promise<void>;

/**
 * Initializes the browser DOM observer and optional Service Worker.
 */
export function initBrowser(options?: BrowserInitOptions): void;
