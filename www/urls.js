// @aufbau/www/urls.js
//
// two places, easily mixed up:
//
//   SITE   where www/ is served, aufbau.dev rewrites to code.pulgasari.dev/aufbau/www.
//          a relative url in a page (../css/…) resolves here, and here is no css/
//   CODE   the whole repo, the packages and their files (css/, gestalt/, elements/ …)
//
// a page that reads a file of a package takes it from CODE, never relative to itself:
//
//   import { CODE } from '../urls.js';
//   fetch(`${CODE}/css/functions.css`);
//
// markup can not import, an attribute writes the CODE url out:
//
//   <svg-file src="https://code.pulgasari.dev/aufbau/svg/icons/aufbau.svg"></svg-file>

export const SITE = 'https://aufbau.dev';
export const CODE = 'https://code.pulgasari.dev/aufbau';
