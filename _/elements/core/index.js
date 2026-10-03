// @aufbau/elements/core/index.js

import AufbauConfig  from './AufbauConfig.js';
import AufbauControl from './AufbauControl.js';
import AufbauCore    from './AufbauCore.js';

export class AufbauElement extends AufbauCore {}

export { AufbauConfig, AufbauControl, AufbauCore };

export * from './options.js';
export * from './skin.js';
export * from './valueTypes.js';
