// @aufbau/elements/core/AufbauControl.js
// shared base for every element that HOLDS A VALUE.
//
// it makes the controls real form participants: they show up in FormData, they
// reset with the form, they match :invalid, and getFormValues() from
// @domina/core reads them without any extra wiring.
//
// subclasses override render()/sync() as usual and call super.sync() so the
// shared state (disabled, aria, form value, validity) is applied.

import AufbauCore         from './AufbauCore.js';
import { Logger }         from '@pulgasari/logger';
import { resolvePersist } from './persist.js';

const FOCUSABLE = 'input, textarea, select, button, [tabindex]:not([tabindex="-1"])';

const log = new Logger({ prefix: 'aufbau-control' });

export class AufbauControl extends AufbauCore (HTMLElement) {

  static formAssociated = true;

  // merged into every subclass schema, see attrOwners() in ./schema.js
  static attr = {
    disabled : Boolean,
    label    : String,
    name     : String,
    persist  : String,
    readonly : Boolean,
    required : Boolean,
    value    : String,
  };

  // structure shared by every control. colours, borders and radii belong to the
  // skin, see ../../css/skins/. declared on the base class on purpose: styleOwners()
  // keys sheets by their declaring class, so this is adopted exactly once
  static styles = `
    [hidden] { display: none !important; }

    aufbau-input, aufbau-picker, aufbau-slider, aufbau-toggle, aufbau-upload, aufbau-writer {
      display: inline-block;
      box-sizing: border-box;
      font: inherit;
      color: inherit;
    }

    aufbau-input *, aufbau-picker *, aufbau-slider *, aufbau-toggle *, aufbau-upload *, aufbau-writer * {
      box-sizing: border-box;
    }

    .is-disabled { pointer-events: none; }
  `;

  constructor () {
    super();
    // guarded, older browsers and ssr shims have no ElementInternals
    this._internals = this.attachInternals?.() ?? null;
  }

  connectedCallback () {
    // strictly before readPersisted(), otherwise a restored value would become
    // the state form.reset() goes back to
    this.captureDefaults();

    // before super, so the very first update() already sees the restored state
    this.readPersisted();

    super.connectedCallback();
  }

  /**
   * the authored markup state, kept for form.reset(). subclasses whose state is
   * not in `value` override this and call super first.
   */
  captureDefaults () {
    this._defaultValue ??= this.getAttribute('value') ?? '';
    return this;
  }

  // :::::: VALUE :::::::::::::::::::::::::::::::::::::::::::::::

  // the pair subclasses override to own their value shape
  parseValue  (raw)   { return raw   == null ? '' : String(raw);   }
  formatValue (value) { return value == null ? '' : String(value); }

  get defaultValue ()     { return this._defaultValue ?? ''; }
  get value        ()     { return this.parseValue(this.getAttribute('value')); }
  set value        (next) { this.commit(next, { notify: false }); }

  

  /** what goes into FormData. null means the control submits nothing */
  get formValue () {
    const formatted = this.formatValue(this.value);
    return formatted === '' ? null : formatted;
  }

  /**
   * the single write path for a value: attribute -> form state -> events.
   * everything that changes a value goes through here, never through setAttr
   * directly, otherwise the form state silently drifts from the dom.
   */
  commit (next, { notify = true } = {}) {
    const formatted = this.formatValue(next);
    const changed   = formatted !== (this.getAttribute('value') ?? '');

    this.setAttr({ value: formatted === '' ? false : formatted });
    this.syncFormState();

    if (notify && changed) this.notify();
    return this;
  }

  /** native-looking events, so listeners treat these like any other control */
  notify () {
    const value = this.value;
    this.emit('input',  { value });
    this.emit('change', { value });
    return this;
  }

  // :::::: FORM ::::::::::::::::::::::::::::::::::::::::::::::::

  get form              () { return this._internals?.form ?? null; }
  get labels            () { return this._internals?.labels ?? []; }
  get validity          () { return this._internals?.validity ?? null; }
  get validationMessage () { return this._internals?.validationMessage ?? ''; }
  get willValidate      () { return this._internals?.willValidate ?? false; }

  checkValidity   () { return this._internals?.checkValidity()   ?? true; }
  reportValidity  () { return this._internals?.reportValidity()  ?? true; }

  setCustomValidity (message) {
    this._customError = message || '';
    this.validate();
    return this;
  }

  syncFormState () {
    this._internals?.setFormValue(this.formValue);
    // the one point every write path passes: commit() as well as state that
    // never touches value, like AufbauToggle.setChecked()
    this.savePersisted();
    return this;
  }

  /**
   * subclasses extend this by overriding and calling super.validate() first,
   * then narrowing with their own setValidity() call.
   */
  validate () {
    const internals = this._internals;
    if (!internals) return this;

    const anchor = this.focusTarget ?? this;

    if (this._customError) internals.setValidity({ customError: true }, this._customError, anchor);
    else if (this.getAttr('required') && this.formValue == null) {
      internals.setValidity({ valueMissing: true }, 'please fill out this field.', anchor);
    }
    else internals.setValidity({});

    return this;
  }

  formResetCallback        ()         { this.commit(this.defaultValue, { notify: false }); }
  formStateRestoreCallback (state)    { this.commit(state, { notify: false }); }
  formDisabledCallback     (disabled) { this._formDisabled = disabled; this.update(); }

  // :::::: PERSISTENCE :::::::::::::::::::::::::::::::::::::::::::
  // opt in per control via the `persist` attribute:
  // persist                  localStorage    key from name or id
  // persist="session"        sessionStorage  key from name or id
  // persist="theme"          localStorage    key "theme"
  // persist="session:theme"  sessionStorage  key "theme"
  // the attribute grammar is parsed in ./persist.js, which also owns the
  // namespace, the quota handling and the private-mode fallback.

  get persistTarget () {
    if (!this.hasAttribute('persist')) return null;

    const target = resolvePersist(this.getAttribute('persist'), { id: this.id, name: this.getAttribute('name') });

    if (!target && !this._persistWarned) {
      this._persistWarned = true;
      log.warn(`<${this.tag} persist> needs a name, an id or persist="<key>" to store under.`);
    }

    return target;
  }

  /**
   * what gets written. the raw attribute rather than formValue on purpose:
   * AufbauPicker returns a FormData from formValue when it is `multiple`.
   */
  get persistedState () { return this.getAttribute('value') ?? ''; }

  /** reuses the per element restore path the form api already goes through */
  restorePersisted (state) { this.formStateRestoreCallback(state); }

  readPersisted () {
    const target = this.persistTarget;
    if (!target) return this;

    const stored = target.store.getSync(target.key);
    if (stored !== null) {
      this._persistedLast = stored;
      this.restorePersisted(stored);
    }

    return this;
  }

  savePersisted () {
    const target = this.persistTarget;
    if (!target) return this;

    const state = this.persistedState;
    if (state === this._persistedLast) return this;

    // an empty control that was never stored has nothing worth writing. without
    // this, merely putting `persist` on a control fills storage with "" on connect.
    // clearing a control that *was* stored still persists, which is the point.
    if (state === '' && !target.store.hasSync(target.key)) return this;

    this._persistedLast = state;
    target.store.setSync(target.key, state);
    return this;
  }

  // :::::: STATE :::::::::::::::::::::::::::::::::::::::::::::::

  /** disabled by our own attribute OR by an ancestor <fieldset disabled> */
  get isDisabled () { return this.getAttr('disabled') || Boolean(this._formDisabled); }

  get focusTarget () { return this.$(FOCUSABLE); }

  focus (options) {
    const target = this.focusTarget;
    if (target) target.focus(options);
    else HTMLElement.prototype.focus.call(this, options);
  }

  blur () { (this.focusTarget ?? this).blur(); }

  /** shared per-pass state. subclasses call this from their own sync() */
  sync () {
    const { label, readonly, required } = this.getAttr();
    const disabled  = this.isDisabled;
    const internals = this._internals;

    if (internals) {
      internals.ariaDisabled = String(disabled);
      internals.ariaRequired = String(required);
      internals.ariaReadOnly = String(readonly);
      if (label) internals.ariaLabel = label;
    }

    this.classList.toggle('is-disabled', disabled);
    this.classList.toggle('is-readonly', readonly);

    // a disabled control must drop out of the tab order entirely
    if (disabled) this.setAttribute('tabindex', '-1');
    else this.removeAttribute('tabindex');

    // only ever undo what WE disabled. an option that carries its own disabled
    // attribute must survive the host being re-enabled
    for (const element of this.$$('button, input, select, textarea')) {
      if (disabled) {
        element.setAttribute('disabled', '');
        element.dataset.hostDisabled = '';
      }
      else if ('hostDisabled' in element.dataset) {
        element.removeAttribute('disabled');
        delete element.dataset.hostDisabled;
      }
    }

    this.syncFormState();
    this.validate();
    return this;
  }
}

export default AufbauControl;
