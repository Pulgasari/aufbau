// @aufbau/elements2/core/AufbauComponent.js
// the base of every component: a composition of the aufbau-* elements, rendered
// into the light dom. the skin is adopted by the document and selects the
// elements by tag, inside a shadow root it would not reach them.
//
// one inner element holds the value (static control). the component hands its
// attributes to that element (static forward), so the form sees exactly one
// control: validity, reset, persist and the input/change events are its own.
// the component's `value` reads and writes through to it.

import { AufbauElement } from './index.js';
import setAttr           from '@domina/methods/setAttr.js';

// forwarded by every component, a subclass adds its own through static forward
const FORWARD = ['disabled', 'label', 'name', 'persist', 'readonly', 'required'];

export class AufbauComponent extends AufbauElement {

  static attr = {
    disabled : Boolean,
    label    : String,
    name     : String,
    persist  : String,
    readonly : Boolean,
    required : Boolean,
    value    : String,
  };

  // selector of the inner element that holds the value
  static control = null;

  // further attributes handed to the control, in their camelCase schema names
  static forward = [];

  get control () { return this.constructor.control ? this.querySelector(this.constructor.control) : null; }

  get value () { return this.control?.value ?? this.getAttribute('value') ?? ''; }

  set value (value) {
    if (this.control) this.control.value = value;
    else this.setAttribute('value', value ?? '');
  }

  /**
   * the value attribute as it was on connect. render() puts it into the markup
   * once, later changes go through onAttributeChange(). the markup must stay the
   * same, a new one would rebuild the control and drop what the user did
   */
  get initialValue () { return this._initialValue ??= this.getAttribute('value') ?? ''; }

  /**
   * hook, listeners on the inner elements. runs once the markup is there: after
   * the first render and again on every reconnect, the disconnect released them
   * and a cached markup is not rendered anew
   */
  bind () {}

  onMount  () { if (this._markup !== undefined) this.bind(); }
  onRender () { this.bind(); }

  onAttributeChange (name, oldValue, newValue) {
    if (name === 'value' && this.control) this.control.value = newValue ?? '';
  }

  /** hands the forwarded attributes to the control, resolved: defaults and config included */
  sync () {
    const control = this.control;
    if (!control) return;

    const values = this.getAttr();
    const names  = [...FORWARD, ...this.constructor.forward];
    setAttr(control, Object.fromEntries(names.map(name => [name, values[name] ?? false])));
  }

  /** stops events of helper elements (a search field, a tab switch) at the component, only the control speaks for it */
  mute (element, types = ['change', 'input']) {
    for (const type of types) this.on(element, type, event => event.stopPropagation());
  }
}

export default AufbauComponent;
