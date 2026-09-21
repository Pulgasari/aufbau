// @aufbau/api

export const
applyFilter = (await import('@aufbau/filter')).apply;

  
/*
import setStyleToken from '@domina/methods/setStyleToken.js';
setStyleToken('theme', 'oled');
*/

class AufbauController {
  set theme (value) { setTheme(value); }

  getTheme = async ()   => this.getStyleToken('theme');
  setTheme = async (id) => this.setStyleToken('theme', 'id');

  // lazy bridge to @domina
  dom = {
    getStyleToken: async (key,        target) => (await import('@domina/methods/getStyleToken.js')).default(key, target),
    setStyleToken: async (key, value, target) => (await import('@domina/methods/setStyleToken.js')).default(key, value, target),       
  }
}

const api = new AufbauController;

export default api;

/* :::::: USAGE

import aufbau from '@aufbau/api';

aufbau.setTheme('oled');

*/
