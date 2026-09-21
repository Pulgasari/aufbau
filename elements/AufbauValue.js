// <aufbau-value>

/*
- ist quasi für so zeug wo man sich üblicherweise <span class='date'>...</span> usw baut
- zusätzlich kanns das auch direkt coercen/normalisieren
- also wenn ich timestamp oder datetime string reingebe wird bei type='date' dann trotzdem 2026-04-20 angezeigt oder so
- erstmal nehmen wir da irgend standardmäßig
- später sollte man das auch iwie in attribute angeben können und/oder in der globalen config festlegen können
- optional wird der wert mit icon davor angezeigt
- optional mit copy-icon dahinter ums zum clipboard zu kopieren
- types, die mir auf anhieb einfallen: date, time, datetime aber später kommen bestimmt noch mehr hinzu
*/

/*
<aufbau-value type='date'></aufbau-value>
<aufbau-value type='time'></aufbau-value>
*/

import { AufbauElement } from './core/index.js';

const icon = {
  date : '',
  time : '',
};

export default class AufbauValue extends AufbauElement {
  
}

AufbauValue.init();
