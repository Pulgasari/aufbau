// @aufbau/elements2/htx
// the elements for htx. names only, no element is imported here: load them as
// usual (autoloader() or the modules). `args` names the attributes positional
// values fill, in order. positionals beyond them become children, which is
// where the label of a button or the text of a reader belong.
//
// the aufbau-* elements get a $ shorthand:
//
//   <$btn variant="primary">Save</$btn>       <aufbau-button variant="primary">Save</aufbau-button>
//
// the others are real tags already, they are exported under the camelCase of
// the tag, which htx reads as its kebab-case:
//
//   <input-color 'red' name="color" />        <input-color value="red" name="color">
//   <embed-youtube 'dQw4w9WgXcQ' />           <embed-youtube src="dQw4w9WgXcQ">
//   <svg-icon 'lucide:search' '1.5em' />      <svg-icon icon="lucide:search" size="1.5em">

export const
$audio    = { tag: 'aufbau-audio',     args: 'src' },
$btn      = 'aufbau-button',
$code     = { tag: 'aufbau-code',      args: 'lang' },
$crumbs   = { tag: 'aufbau-crumbs',    args: 'path' },
$datalist = 'aufbau-datalist',
$dropdown = { tag: 'aufbau-dropdown',  args: 'label' },
$embed    = { tag: 'aufbau-embed',     args: 'src' },
$filter   = { tag: 'aufbau-filter',    args: 'target' },
$index    = 'aufbau-index',
$item     = 'aufbau-item',
$keyboard = 'aufbau-keyboard',
$loop     = 'aufbau-loop',
$modal    = { tag: 'aufbau-modal',     args: 'heading' },
$progress = { tag: 'aufbau-progress',  args: 'value' },
$reader   = 'aufbau-reader',
$skeleton = { tag: 'aufbau-skeleton',  args: 'shape' },
$table    = { tag: 'aufbau-table',     args: 'src' },
$toast    = { tag: 'aufbau-toast',     args: 'message' },
$toc      = 'aufbau-toc',
$tree     = 'aufbau-tree',
$treeItem = { tag: 'aufbau-tree-item', args: 'label' },
$upload   = 'aufbau-upload',
$value    = { tag: 'aufbau-value',     args: 'type' },
$video    = { tag: 'aufbau-video',     args: 'src' },
$waveform = { tag: 'aufbau-waveform',  args: 'src' },
$writer   = 'aufbau-writer',

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
inputDatetime   = { args: 'value' },
inputDuration   = { args: 'value' },
inputEmail      = { args: 'value' },
inputEmoji      = { args: 'value' },
inputFont       = { args: 'value' },
inputHotkey     = { args: 'value' },
inputIcon       = { args: 'value' },
inputLanguage   = { args: 'value' },
inputLocale     = { args: 'value' },
inputNumber     = { args: 'value' },
inputOption     = { args: 'value' },
inputPassword   = { args: 'value' },
inputPattern    = { args: 'value' },
inputPhone      = { args: 'value' },
inputSearch     = { args: 'value' },
inputSlug       = { args: 'value' },
inputText       = { args: 'value' },
inputTime       = { args: 'value' },
inputTimezone   = { args: 'value' },
inputUnit       = { args: 'value' },
inputUrl        = { args: 'value' },
inputValue      = { args: 'type' },
inputYear       = { args: 'value' },
svgFlag         = { args: 'code' },
svgIcon         = { args: ['icon', 'size'] },
writeMd         = { args: 'value' };

/* :::::: USAGE

import htx from '@htx/js';
import * as elements from '@aufbau/elements2/htx';

htx.define(elements);

*/
