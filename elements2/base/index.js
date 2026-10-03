// @aufbau/elements2/base/index.js

import AufbauConfig  from './AufbauConfig.js';
import AufbauControl from './AufbauControl.js';
import AufbauCore    from './AufbauCore.js';

export class AufbauElement extends AufbauCore {}

export { AufbauConfig, AufbauControl, AufbauCore };

export * from '../lib/options.js';
export * from '../lib/skin.js';
export * from '../lib/valueTypes.js';
