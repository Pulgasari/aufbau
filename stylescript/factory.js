// factory.js

import { Controller } from './classes/Controller.js';

// the default global controller. named `ass` for the package's authoring entry.
export const ass = new Controller;

// a fresh, isolated controller (own aliases/tokens/vars/sheets and default target).
export const createController = (options) => new Controller(options);

// a single sheet bound to the default controller — the module-per-sheet pattern.
export const stylesheet = (options) => ass.createSheet(options);
