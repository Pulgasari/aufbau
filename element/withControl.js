import { Logger } from '@pulgasari/logger';

import { resolvePersist } from './lib/persist.js';
import { AufbauElement }  from './AufbauElement.js';

const FOCUSABLE = 'input, textarea, select, button, [tabindex]:not([tabindex="-1"])';

const log = new Logger({ prefix: 'aufbau-control' });

// a form control: value, FormData, validity, form.reset(), disabled from a fieldset, persist
export const withControl = Base => class AufbauControl extends Base {

  static formAssociated = true;

  static attr = {
    disabled : Boolean,
    label    : String,
    name     : String,
    persist  : String,
    readonly : Boolean,
    required : Boolean,
    value    : String,
  };

  static styles = `
    [hidden] { display: none !important; }

    :host, write-text {
      box-sizing : border-box;
      color      : inherit;
      display    : inline-block;
      font       : inherit;
    }

    :host *, write-text * { box-sizing: border-box; }

    :host(:state(disabled)), write-text:state(disabled) { pointer-events: none; }
  `;

  static internals = true;

  connectedCallback () {
    this.captureDefaults(); // strictly before readPersisted(), otherwise a restored value would become the state form.reset() goes back to      
    this.readPersisted(); // before super, so the very first update() already sees the restored state    
    super.connectedCallback();
  }

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

  

  get formValue () {
    const formatted = this.formatValue(this.value);
    return formatted === '' ? null : formatted;
  }

  commit (next, { notify = true } = {}) {
    const formatted = this.formatValue(next);
    const changed   = formatted !== (this.getAttribute('value') ?? '');

    this.setAttr({ value: formatted === '' ? false : formatted });
    this.syncFormState();

    if (notify && changed) this.notify();
    return this;
  }

  notify () {
    const value = this.value;
    this.emit('input',  { value });
    this.emit('change', { value });
    return this;
  }

  // :::::: FORM ::::::::::::::::::::::::::::::::::::::::::::::::

  // the own attribute or a disabled fieldset
  get disabled ()      { return this.getAttr('disabled') || Boolean(this._formDisabled); }
  set disabled (value) { this.setAttr({ disabled: Boolean(value) }); }
  get name     ()      { return this.getAttribute('name') ?? ''; }
  get type     ()      { return this.getAttribute('type') ?? this.localName; }

  get form              () { return this.internals?.form              ?? null;  }
  get labels            () { return this.internals?.labels            ?? [];    }
  get validity          () { return this.internals?.validity          ?? null;  }
  get validationMessage () { return this.internals?.validationMessage ?? '';    }
  get willValidate      () { return this.internals?.willValidate      ?? false; }

  checkValidity   () { return this.internals?.checkValidity()  ?? true; }
  reportValidity  () { return this.internals?.reportValidity() ?? true; }

  setCustomValidity (message) {
    this._customError = message || '';
    this.validate();
    return this;
  }

  syncFormState () {
    this.internals?.setFormValue(this.formValue);
    this.savePersisted();
    return this;
  }

  validate () {
    const internals = this.internals; if (!internals) return this;
    const anchor    = this.focusTarget ?? this;

    if (this._customError) internals.setValidity({ customError: true }, this._customError, anchor);
    else if (this.getAttr('required') && this.formValue == null) {
      internals.setValidity({ valueMissing: true }, 'please fill out this field.', anchor);
    }
    else internals.setValidity({});

    return this;
  }

  formAssociatedCallback   (form)        { this.onFormAssociated(form); }
  formDisabledCallback     (disabled)    { this._formDisabled = disabled; this.update(); this.onFormDisabled(disabled); }
  formResetCallback        ()            { this.commit(this.defaultValue, { notify: false }); this.onFormReset(); }
  formStateRestoreCallback (state, mode) { this.commit(state, { notify: false }); this.onFormStateRestore(state, mode); }

  // ::: hooks, after the default handling above

  onFormAssociated   (form)        {}
  onFormDisabled     (disabled)    {}
  onFormReset        ()            {}
  onFormStateRestore (state, mode) {}

  // :::::: PERSISTENCE :::::::::::::::::::::::::::::::::::::::::::

  get persistTarget () {
    if (!this.hasAttribute('persist')) return null;

    const target = resolvePersist(this.getAttribute('persist'), { id: this.id, name: this.getAttribute('name') });

    if (!target && !this._persistWarned) {
      this._persistWarned = true;
      log.warn(`<${this.localName} persist> needs a name, an id or persist="<key>" to store under.`);
    }

    return target;
  }

  get persistedState () { return this.getAttribute('value') ?? ''; }

  restorePersisted (state) { this.formStateRestoreCallback(state); }

  readPersisted () {
    const target = this.persistTarget; if (!target) return this;
    const stored = target.store.getSync(target.key);
    if (stored !== null) {
      this._persistedLast = stored;
      this.restorePersisted(stored);
    }

    return this;
  }

  savePersisted () {
    const target = this.persistTarget; if (!target) return this;
    const state  = this.persistedState;
    if (state === this._persistedLast) return this;

    if (state === '' && !target.store.hasSync(target.key)) return this;

    this._persistedLast = state;
    target.store.setSync(target.key, state);
    return this;
  }

  // :::::: STATE :::::::::::::::::::::::::::::::::::::::::::::::

  get focusTarget () { return this.$(FOCUSABLE).node; }

  focus (options) {
    this.focusTarget?.focus(options)
    ?? HTMLElement.prototype.focus.call(this, options);
  }

  blur () { (this.focusTarget ?? this).blur(); }

  sync () {
    const { label, readonly, required } = this.getAttr();
    const disabled  = this.disabled;
    const internals = this.internals;

    if (internals) {
      internals.ariaDisabled = String(disabled);
      internals.ariaRequired = String(required);
      internals.ariaReadOnly = String(readonly);
      if (label) internals.ariaLabel = label;
    }

    this.states.toggle('disabled', disabled);
    this.states.toggle('readonly', readonly);

    if (disabled) this.setAttribute('tabindex', '-1');
    else          this.removeAttribute('tabindex');

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
};

export const AufbauControlElement = withControl(AufbauElement);

export default AufbauControlElement;
