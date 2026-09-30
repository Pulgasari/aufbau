// @aufbau/components/htx
// the components for htx. they are real tags, so htx only learns what the
// positional values fill: exported under the camelCase of the tag, which htx
// reads as its kebab-case. `tag` is the tag the component is defined under,
// the same one unless configure() renamed it.
//
//   <input-color 'red' name="color" />             <input-color value="red" name="color">
//   <input-language 'de' languages="de en fr" />   <input-language value="de" languages="de en fr">
//   <embed-youtube 'dQw4w9WgXcQ' />                <embed-youtube src="dQw4w9WgXcQ">
//
// the templates always spell the canonical tag. the tags are read when this
// module is evaluated, a configure() with a prefix or a rename map has to come
// first.

/*
shorthand tags for htx, like @aufbau/elements/htx. 
`args` names the attributes positional values fill, in order.

  <$inputIcon 'lucide:star' name="icon" />      <input-icon value="lucide:star" name="icon">
  <$inputLanguage 'de' languages="de en fr" />  <input-language value="de" languages="de en fr">
  <$writeMd ${notes} preview="side" />          <write-md value="…" preview="side">

the tags are read when this module is evaluated, 
a configure() with a prefix or a rename map has to come first.
*/

import { tagOf } from '../core/names.js';

export const
embedBandcamp   = { tag: tagOf('embed-bandcamp'),   args: 'src' },
embedMastodon   = { tag: tagOf('embed-mastodon'),   args: 'src' },
embedSoundcloud = { tag: tagOf('embed-soundcloud'), args: 'src' },
embedSpotify    = { tag: tagOf('embed-spotify'),    args: 'src' },
embedVimeo      = { tag: tagOf('embed-vimeo'),      args: 'src' },
embedYoutube    = { tag: tagOf('embed-youtube'),    args: 'src' },
inputBool       = { tag: tagOf('input-bool'),       args: 'value' },
inputChips      = { tag: tagOf('input-chips'),      args: 'value' },
inputColor      = { tag: tagOf('input-color'),      args: 'value' },
inputCountry    = { tag: tagOf('input-country'),    args: 'value' },
inputCurrency   = { tag: tagOf('input-currency'),   args: 'value' },
inputDate       = { tag: tagOf('input-date'),       args: 'value' },
inputEmail      = { tag: tagOf('input-email'),      args: 'value' },
inputEmoji      = { tag: tagOf('input-emoji'),      args: 'value' },
inputFont       = { tag: tagOf('input-font'),       args: 'value' },
inputHotkey     = { tag: tagOf('input-hotkey'),     args: 'value' },
inputIcon       = { tag: tagOf('input-icon'),       args: 'value' },
inputItem       = { tag: tagOf('input-item'),       args: 'value' },
inputLanguage   = { tag: tagOf('input-language'),   args: 'value' },
inputLocale     = { tag: tagOf('input-locale'),     args: 'value' },
inputNumber     = { tag: tagOf('input-number'),     args: 'value' },
inputPassword   = { tag: tagOf('input-password'),   args: 'value' },
inputPhone      = { tag: tagOf('input-phone'),      args: 'value' },
inputSearch     = { tag: tagOf('input-search'),     args: 'value' },
inputSlug       = { tag: tagOf('input-slug'),       args: 'value' },
inputText       = { tag: tagOf('input-text'),       args: 'value' },
inputTime       = { tag: tagOf('input-time'),       args: 'value' },
inputTimezone   = { tag: tagOf('input-timezone'),   args: 'value' },
inputUnit       = { tag: tagOf('input-unit'),       args: 'value' },
inputUrl        = { tag: tagOf('input-url'),        args: 'value' },
inputYear       = { tag: tagOf('input-year'),       args: 'value' },
writeMd         = { tag: tagOf('write-md'),         args: 'value' };

/* :::::: USAGE

import htx from '@htx/js';
import * as components from '@aufbau/components/htx';
import * as elements   from '@aufbau/elements/htx';

htx.define({ ...elements, ...components });

*/
