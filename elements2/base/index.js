// @aufbau/elements2/base/index.js
// the classes every element builds on. AufbauElement is the plain one, a
// control (it holds a value for a form) extends AufbauControl

import AufbauConfig  from './AufbauConfig.js';
import AufbauControl from './AufbauControl.js';
import AufbauCore    from './AufbauCore.js';

export class AufbauElement extends AufbauCore {}

export { AufbauConfig, AufbauControl, AufbauCore };
