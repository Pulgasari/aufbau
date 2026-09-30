// @aufbau/components/htx
// the components for htx. they are real tags, so htx only learns what the
// positional values fill: exported under the camelCase of the tag, which htx
// reads as its kebab-case.
//
//   <input-color 'red' name="color" />             <input-color value="red" name="color">
//   <input-language 'de' languages="de en fr" />   <input-language value="de" languages="de en fr">
//   <embed-youtube 'dQw4w9WgXcQ' />                <embed-youtube src="dQw4w9WgXcQ">
//
// the canonical tags only. a component renamed by configure() is defined for
// htx under its new name: html.define({ xInputColor: { args: 'value' } }).

export const
appView         = { args: 'name' },
embedBandcamp   = { args: 'src' },
embedMastodon   = { args: 'src' },
embedSoundcloud = { args: 'src' },
embedSpotify    = { args: 'src' },
embedVimeo      = { args: 'src' },
embedYoutube    = { args: 'src' },
inputBool       = { args: 'value' },
inputChips      = { args: 'value' },
inputColor      = { args: 'value' },
inputCountry    = { args: 'value' },
inputCurrency   = { args: 'value' },
inputDate       = { args: 'value' },
inputEmail      = { args: 'value' },
inputEmoji      = { args: 'value' },
inputFont       = { args: 'value' },
inputHotkey     = { args: 'value' },
inputIcon       = { args: 'value' },
inputItem       = { args: 'value' },
inputLanguage   = { args: 'value' },
inputLocale     = { args: 'value' },
inputNumber     = { args: 'value' },
inputPassword   = { args: 'value' },
inputPhone      = { args: 'value' },
inputSearch     = { args: 'value' },
inputSlug       = { args: 'value' },
inputText       = { args: 'value' },
inputTime       = { args: 'value' },
inputTimezone   = { args: 'value' },
inputUnit       = { args: 'value' },
inputUrl        = { args: 'value' },
inputYear       = { args: 'value' },
writeMd         = { args: 'value' };

/* :::::: USAGE

import htx from '@htx/js';
import * as components from '@aufbau/components/htx';
import * as elements   from '@aufbau/elements/htx';

htx.define({ ...elements, ...components });

*/
