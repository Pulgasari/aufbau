#!/usr/bin/env node
// @aufbau/bundler/cli.js
// runs bundle() with a config module, whose default export is the config or a
// function returning it (it gets the remaining arguments as key=value pairs):
//
//   node aufbau/bundler/cli.js bundler.config.js slug=notes out=build/notes/www

import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { bundle } from './index.js';

const [file = 'bundler.config.js', ...pairs] = process.argv.slice(2);
const options = Object.fromEntries(pairs.map(pair => pair.split('=')));

const exported = (await import(pathToFileURL(resolve(file)))).default;
const config   = typeof exported === 'function' ? await exported(options) : exported;

const { summary } = await bundle(config);
console.log('\n' + summary);
