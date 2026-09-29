// @aufbau/components/htx
// shorthand tags for htx, like @aufbau/elements/htx. `args` names the
// attributes positional values fill, in order.
//
//   <$pickIcon 'lucide:star' name="icon" />        <pick-icon value="lucide:star" name="icon">
//   <$pickLanguage 'de' languages="de en fr" />    <pick-language value="de" languages="de en fr">
//   <$writeMd ${notes} preview="side" />           <write-md value="…" preview="side">
//
// the tags are read when this module is evaluated, a configure() with a prefix
// or new names has to come first.

import { tagOf } from '../core/names.js';

export const
$pickIcon     = { tag: tagOf('pick-icon'),     args: 'value' },
$pickLanguage = { tag: tagOf('pick-language'), args: 'value' },
$writeMd      = { tag: tagOf('write-md'),      args: 'value' };

/* :::::: USAGE

import * as components from '@aufbau/components/htx';
import * as elements   from '@aufbau/elements/htx';

html.define({ ...elements, ...components });

*/
