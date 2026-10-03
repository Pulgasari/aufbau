import '../svg-icon.js';

import { AufbauElement } from '@aufbau/element';
import { isFn }          from '@pulgasari/is';
import { toCamelCase }   from '@pulgasari/str';
import { html }          from '../../lib/html.js';

// command -> icon (an alias of @aufbau/icons) and label. Btn.commands takes more
const COMMANDS = {
  add      : { icon: 'add',          label: 'add'      },
  back     : { icon: 'arrow-left',   label: 'back'     },
  cancel   : { icon: 'close',        label: 'cancel'   },
  close    : { icon: 'close',        label: 'close'    },
  collapse : { icon: 'chevron-up',   label: 'collapse' },
  copy     : { icon: 'copy',         label: 'copy'     },
  delete   : { icon: 'delete',       label: 'delete'   },
  edit     : { icon: 'edit',         label: 'edit'     },
  expand   : { icon: 'chevron-down', label: 'expand'   },
  menu     : { icon: 'menu',         label: 'menu'     },
  more     : { icon: 'more',         label: 'more'     },
  save     : { icon: 'save',         label: 'save'     },
  search   : { icon: 'search',       label: 'search'   },
  share    : { icon: 'share',        label: 'share'    },
};

// the base of btn-push, btn-tap and btn-icon. a form associated button that can
// run a command on a target, named like the native invoker commands:
//   <btn-icon command="close">                   the nearest element above that has close()
//   <btn-tap command="share" commandfor="#post">  an id or a selector
// a target without that method gets a command event instead
export class Btn extends AufbauElement {
  static commands = COMMANDS;

  static formAssociated = true;

  static internals = { role: 'button' };

  static shadow = true;

  static attr = {
    command    : String,
    commandfor : String,
    disabled   : Boolean,
    icon       : String,
    label      : String,
    type       : { default: 'button', values: ['button', 'reset', 'submit'] },
  };

  static styles = `
    :host {
      align-items     : center;
      border-radius   : var(--btn-radius, 0.375em);
      cursor          : pointer;
      display         : inline-flex;
      gap             : 0.5em;
      justify-content : center;
      line-height     : 1.2;
      user-select     : none;
    }

    :host(:hover)         { background-color: color-mix(in oklab, currentColor 8%, var(--btn-background, transparent)); }
    :host(:focus-visible) { outline: 2px solid color-mix(in oklab, currentColor 55%, transparent); outline-offset: 2px; }
    :host([disabled])     { cursor: not-allowed; opacity: 0.5; }

    svg-icon { flex: none; }
  `;

  get disabled ()      { return this.hasAttribute('disabled'); }
  set disabled (value) { this.toggleAttribute('disabled', Boolean(value)); }
  get form     ()      { return this.internals?.form ?? null; }

  // the preset of the command, {} for none
  get preset    () { return this.constructor.commands[this.getAttr('command')] ?? {}; }
  get iconName  () { return this.getAttr('icon') ?? this.preset.icon; }
  get labelText () { return this.getAttr('label') ?? this.preset.label ?? ''; }

  // close -> close(), show-modal -> showModal(), --my-thing -> myThing()
  get method () { return toCamelCase(this.getAttr('command')?.replace(/^--/, '') ?? ''); }

  get commandTarget () {
    const selector = this.getAttr('commandfor');
    if (selector) return document.getElementById(selector) ?? this.getRootNode().querySelector?.(selector) ?? document.querySelector(selector);

    // up through shadow roots as well, to the first element that has the method
    for (let node = this.parentElement ?? this.getRootNode().host; node; node = node.parentElement ?? node.getRootNode().host) {
      if (isFn(node[this.method])) return node;
    }
    return null;
  }

  run () {
    const command = this.getAttr('command');
    const target  = command && this.commandTarget;
    if (!target) return;

    if (isFn(target[this.method])) return target[this.method]();

    const event = typeof CommandEvent === 'function'
      ? new CommandEvent('command', { cancelable: true, command, source: this })
      : new CustomEvent('command', { cancelable: true, detail: { command, source: this } });
    target.dispatchEvent(event);
  }

  onConnected () {
    this.on('click', event => {
      if (this.disabled) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, { capture: true });

    this.on('click', event => {
      if (event.defaultPrevented) return;
      const type = this.getAttr('type');
      if (type === 'submit') this.form?.requestSubmit();
      if (type === 'reset')  this.form?.reset();
      this.run();
    });

    // native timing: enter activates on keydown, space on keyup
    this.on('keydown', event => {
      if (event.target !== this) return;
      if (event.key === 'Enter') { event.preventDefault(); this.click(); }
      if (event.key === ' ')     event.preventDefault();
    });

    this.on('keyup', event => { if (event.target === this && event.key === ' ') this.click(); });
  }

  // icon, then the children, the label or the label of the command
  render () {
    const icon = this.iconName;
    return html`
      ${icon && html`<svg-icon part="icon" icon="${icon}"></svg-icon>`}
      <span part="label"><slot>${this.labelText}</slot></span>
    `;
  }

  sync () {
    if (this.internals) this.internals.ariaDisabled = String(this.disabled);
    this.tabIndex = this.disabled ? -1 : 0;
  }
}
