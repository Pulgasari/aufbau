// @aufbau/elements/core/index.js

import AufbauConfig from './AufbauConfig.js';
import AufbauCore   from './AufbauCore.js';

export class AufbauDatalistElement extends AufbauCore (HTMLDataListElement) { static extendsTag = 'datalist'; }    
export class AufbauElement         extends AufbauCore (HTMLElement)         {}

export { AufbauConfig };
