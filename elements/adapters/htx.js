// @aufbau/elements/htx
// shorthand tags for htx. `args` names the attributes positional values fill,
// in order. positionals beyond them become children, which is where the label
// of a button, the text of a reader or the value of a value element belong.
//
//   <$icon 'lucide:search' '1.5em' />         <aufbau-icon icon="lucide:search" size="1.5em">
//   <$btn variant="primary">Save</$btn>       <aufbau-button variant="primary">Save</aufbau-button>
//   <$option 'de' 'Deutsch' />                <aufbau-option value="de">Deutsch</aufbau-option>
//   <$code 'js' ${source} />                  <aufbau-code lang="js">…</aufbau-code>
//   <$value 'date' ${timestamp} />            <aufbau-value type="date">…</aufbau-value>
//
// names only, no element is imported here. load them as usual (autoloader() or
// the element modules).

export const
$audio    = { tag: 'aufbau-audio',     args: 'src' },
$btn      = 'aufbau-button',
$code     = { tag: 'aufbau-code',      args: 'lang' },
$crumbs   = { tag: 'aufbau-crumbs',    args: 'path' },
$datalist = 'aufbau-datalist',
$dropdown = { tag: 'aufbau-dropdown',  args: 'label' },
$filter   = { tag: 'aufbau-filter',    args: 'target' },
$flag     = { tag: 'aufbau-flag',      args: 'code' },
$icon     = { tag: 'aufbau-icon',      args: ['icon', 'size'] },
$index    = 'aufbau-index',
$input    = { tag: 'aufbau-input',     args: 'type' },
$item     = 'aufbau-item',
$keyboard = 'aufbau-keyboard',
$loop     = 'aufbau-loop',
$modal    = { tag: 'aufbau-modal',     args: 'heading' },
$option   = { tag: 'aufbau-option',    args: 'value' },
$picker   = { tag: 'aufbau-picker',    args: 'look' },
$progress = { tag: 'aufbau-progress',  args: 'value' },
$reader   = 'aufbau-reader',
$skeleton = { tag: 'aufbau-skeleton',  args: 'shape' },
$slider   = 'aufbau-slider',
$table    = { tag: 'aufbau-table',     args: 'src' },
$toast    = { tag: 'aufbau-toast',     args: 'message' },
$toc      = 'aufbau-toc',
$toggle   = 'aufbau-toggle',
$tree     = 'aufbau-tree',
$treeItem = { tag: 'aufbau-tree-item', args: 'label' },
$upload   = 'aufbau-upload',
$value    = { tag: 'aufbau-value',     args: 'type' },
$video    = { tag: 'aufbau-video',     args: 'src' },
$waveform = { tag: 'aufbau-waveform',  args: 'src' },
$writer   = 'aufbau-writer';

/* :::::: USAGE

import * as shorthands from '@aufbau/elements/htx';

html.define(shorthands);

*/
