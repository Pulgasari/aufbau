// <aufbau-icon>

import { AufbauElement } from './core/index.js';

const ICONIFY = 'https://api.iconify.design';

/**
 * 'lucide:save' and 'lucide/save' both resolve. collection and name are encoded
 * separately, the colon is part of the iconify path and has to survive.
 */
function iconUrl (icon) {
  icon = resolveIcon(icon);
  const [collection, ...rest] = String(icon).replace('/', ':').split(':');
  const name = rest.join(':');
  if (!collection || !name) return null;
  return `${ICONIFY}/${encodeURIComponent(collection)}:${encodeURIComponent(name)}.svg`;
}

export default class AufbauIcon extends AufbauElement {
  static attr = {
    color : String,
    icon  : String,
    // mask recolours the svg with currentColor and throws its own colours away,
    // image keeps them. multicolour art (flags, logos, emoji) needs image
    mode  : { type: String, default: 'mask', values: ['mask', 'image'] },
    size  : String,
  };

  // the element is a coloured box masked by the icon svg. without these the
  // mask never applies and nothing is ever visible, so it is base styling
  // rather than theming. currentColor makes it inherit text colour.
  static styles = `
    aufbau-icon {
      display: inline-block;
      inline-size: var(--icon-size, 1em);
      block-size: var(--icon-size, 1em);
      background-color: var(--icon-color, currentColor);
      vertical-align: var(--icon-align, -0.125em);
      -webkit-mask-image: var(--icon-url);
      mask-image: var(--icon-url);
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
      -webkit-mask-size: 100% 100%;
      mask-size: 100% 100%;
    }

    aufbau-icon[mode="image"] {
      background-color: transparent;
      background-image: var(--icon-url);
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      -webkit-mask-image: none;
      mask-image: none;
    }

    aufbau-icon:not([icon]) { display: none; }
  `;

  // no markup at all, the element is pure css. everything happens in sync()
  sync () {
    const { icon, size, color } = this.getAttr();
    const url = icon ? iconUrl(icon) : null;

    this.style.setProperty('--icon-url',   url ? `url("${url}")` : '');
    this.style.setProperty('--icon-size',  size  || '');
    this.style.setProperty('--icon-color', color || '');

    if (icon && !url) console.warn(`[aufbau-icon] could not parse icon "${icon}"`);
  }
}

AufbauIcon.init();

// shared/js/data/icons.js

const icons = {
  'add'               : 'material-symbols:add',
  'alert'             : 'mdi:alert-circle-outline',
  'arrow-down'        : 'mdi:arrow-down-bold',
  'arrow-left'        : 'material-symbols:arrow-back',
  'arrow-right'       : 'material-symbols:arrow-forward',
  'arrow-up'          : 'material-symbols:arrow-upward',
  'bookmark'          : 'mdi:bookmark',
  'bookmark-unfilled' : 'mdi:bookmark-outline',
  'bookmarks'         : 'mdi:bookmark',
  'books'             : 'mdi:bookshelf',
  'capslock'          : 'material-symbols:keyboard-capslock',
  'check'             : 'mdi:check',
  'check-circle'      : 'mdi:check-circle-outline',
  'chevron-down'      : 'mdi:chevron-down',
  'chevron-left'      : 'mdi:chevron-left',
  'chevron-right'     : 'mdi:chevron-right',
  'chevron-up'        : 'mdi:chevron-up',
  'close'             : 'mdi:close',
  'code'              : 'mdi:code-braces',
  'commands'          : 'material-symbols:keyboard-command-key',
  'content-copy'      : 'mdi:content-copy',
  'copy'              : 'bx:copy',
  'copy-all'          : 'material-symbols:copy-all',
  'copy-file'         : 'material-symbols:file-copy',
  'cut'               : 'material-symbols:cut',
  'delete'            : 'mdi:trash-can-outline',
  'deselect'          : 'material-symbols:deselect',
  'download'          : 'mdi:download',
  'download-multiple' : 'mdi:download-multiple',
  'duplicate'         : 'mdi:content-duplicate',
  'edit'              : 'mdi:pencil-outline',
  'enter'             : 'material-symbols:keyboard-return',
  'external'          : 'mdi:open-in-new',
  'file'              : 'material-symbols:description',
  'folder'            : 'material-symbols:folder',
  'folder-add'        : 'mdi:folder-plus-outline',
  'folder-alert'      : 'mdi:folder-alert-outline',
  'folder-key'        : 'mdi:folder-key-outline',
  'folder-open'       : 'material-symbols:folder-open',
  'folder-search'     : 'mdi:folder-search-outline',
  'folder-swap'       : 'mdi:folder-swap-outline',
  'fontsize'          : 'material-symbols:format-size',
  'fullscreen'        : 'mdi:fullscreen',
  'grid'              : 'mdi:view-grid-outline',
  'heart'             : 'mdi:heart',
  'heart-outline'     : 'mdi:heart-outline',
  'home'              : 'mdi:home-outline',
  'image'             : 'mdi:image-outline',
  'images'            : 'mdi:image-multiple-outline',
  'image-search'      : 'mdi:image-search-outline',
  'import'            : 'mdi:import',
  'info'              : 'mdi:information-outline',
  'keyboard'          : 'tdesign:keyboard',
  'lineheight'        : 'material-symbols:format-line-spacing',
  'loading'           : 'svg-spinners:bars-scale-middle',
  'menu'              : 'mdi:menu',
  'notes'             : 'mdi:file-document-outline',
  'open-in-new'       : 'mdi:open-in-new',
  'paste'             : 'mdi:content-paste',
  'pause'             : 'mdi:pause',
  'play'              : 'mdi:play',
  'plus'              : 'mdi:plus',
  'previewer'         : 'material-symbols:preview',
  'redo'              : 'bx:redo',
  'refresh'           : 'mdi:refresh',
  'remove'            : 'material-symbols:remove',
  'rename'            : 'mdi:form-textbox',
  'reset'             : 'mdi:restore',
  'rss'               : 'mdi:rss',
  'run'               : 'pajamas:live-preview',
  'save'              : 'material-symbols:file-save',
  'search'            : 'bx:search',
  'select'            : 'boxicons:select',
  'select-all'        : 'boxicons:select-all',
  'select-none'       : 'boxicons:select-none',
  'settings'          : 'mdi:cog',
  'shift'             : 'material-symbols:shift',
  'skip-next'         : 'mdi:skip-next',
  'skip-previous'     : 'mdi:skip-previous',
  'sort-lines'        : 'material-symbols:reorder',
  'space'             : 'material-symbols:space-bar',
  'split-line'        : 'material-symbols:split-scene-outline',
  'svg'               : 'mdi:svg',
  'tab'               : 'bx:arrow-to-right',
  'tab-rtl'           : 'bx:arrow-to-left',
  'toggle-off'        : 'material-symbols:toggle-off',
  'toggle-on'         : 'material-symbols:toggle-on',
  'toolbar'           : 'material-symbols:widgets',
  'trash'             : 'mdi:trash-can-outline',
  'undo'              : 'bx:undo',
  'upload'            : 'mdi:upload',
  'viewmode-grid'     : 'mdi:view-grid',
  'viewmode-list'     : 'mdi:view-list',
  'warning'           : 'mdi:alert-outline',
  'workspaces'        : 'grommet-icons:projects',
  'zoom-in'           : 'mdi:magnify-plus-outline',
  'zoom-out'          : 'mdi:magnify-minus-outline',

  // specific for apps/code
  'backspace'           : 'mdi:backspace',
  'blockindent'         : 'material-symbols:keyboard-tab',
  'blockoutdent'        : 'material-symbols:keyboard-tab-rtl',
  'copy-lines-down'     : 'material-symbols:move-down',
  'copy-lines-up'       : 'material-symbols:move-up',
  'join-lines'          : 'material-symbols:join-outline',
  'move-lines-down'     : 'material-symbols:text-select-move-down',
  'move-lines-up'       : 'material-symbols:text-select-move-up',
  'move-selection-down' : 'material-symbols:move-selection-down',
  'move-selection-up'   : 'material-symbols:move-selection-up',

  // brands
  'git'           : 'brandico:github-text',
  'github'        : 'cib:github',
  'github-action' : 'codicon:github-action',
  'youtube'       : 'mdi:youtube',
};

const FALLBACK = 'material-symbols:help';
function resolveIcon (name) {
  return !name ? FALLBACK : name.includes(':') ? name : icons[name] ?? FALLBACK;
}



