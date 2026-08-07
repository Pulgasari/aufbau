// @aufbau/elements/core/index.js

import AufbauConfig  from './AufbauConfig.js';
import AufbauControl from './AufbauControl.js';
import AufbauCore    from './AufbauCore.js';

export class AufbauDatalistElement extends AufbauCore (HTMLDataListElement) { static extendsTag = 'datalist'; }
export class AufbauElement         extends AufbauCore (HTMLElement)         {}

export { AufbauConfig, AufbauControl, AufbauCore };

export * from './options.js';
export * from './valueTypes.js';
