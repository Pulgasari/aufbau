// @aufbau/elements/core/AufbauCore.js

// :::::: IMPORTS

import { BASE, schemaOf }   from './schema.js';
import { applySkin }        from './skin.js';
import { adoptClassStyles } from './styles.js';
import { decorate, decorateAll } from './utils.js';
import { canonicalKey, CONFIG_EVENT, configKeys, resolveConfig } from './AufbauConfig.js';

import { delegateEvent }  from '@domina/methods/delegateEvent.js';
import { emitEvent }      from '@domina/methods/emitEvent.js';
import { getElement }     from '@domina/methods/getElement.js';
import { getElementById } from '@domina/methods/getElementById.js';
import { getElements }    from '@domina/methods/getElements.js';
import { hasAttr }        from '@domina/methods/hasAttr.js';
import { offEvent }       from '@domina/methods/offEvent.js';
import { onEvent }        from '@domina/methods/onEvent.js';
import { setAttr }        from '@domina/methods/setAttr.js';

import { coerce, toBoolean }                      from '@pulgasari/coerce';
import { isArray, isFn, isPlainObject, isString } from '@pulgasari/is';
import { toCamelCase, toKebabCase }               from '@pulgasari/str';
import { Logger }                                 from '@pulgasari/logger';

const isBlank   = sth => sth === undefined || sth === null || sth === false || sth === '';
const isDefined = sth => sth !== undefined;
const log       = new Logger({ prefix: 'aufbau-core' });

const disposer = () => {
  const entries = new Set;
  return {
    add      (stop) { if (isFn(stop)) entries.add(stop); return stop; },
    dispose  ()     { for (const stop of entries) { try { stop(); } catch {} } entries.clear(); },
    get size ()     { return entries.size; }
  };
};

// :state() access, guarded: browsers before 2024 either lack CustomStateSet or
// reject names without a leading `--`. every call degrades to a no-op there
const stateSet = (host) => ({
  add    (name)        { try { host.internals?.states?.add(name);    } catch {} return this; },
  delete (name)        { try { host.internals?.states?.delete(name); } catch {} return this; },
  has    (name)        { try { return Boolean(host.internals?.states?.has(name)); } catch { return false; } },
  toggle (name, force) { return (force ?? !this.has(name)) ? this.add(name) : this.delete(name); },
});

// :::::: SKELETON ::::::::::::::::::::::::::::::::::::::::::::::
// a placeholder painted on the host alone: lines drawn by a gradient, a slow
// pulse, the content invisible but untouched. shape through custom properties,
// see `static skeleton` and setSkeleton() below. both selector forms, the rule is
// adopted into the document and into every shadow root an element lives in

const SKELETON_STYLES = `
  @keyframes aufbau-skeleton { 50% { opacity: 0.45; } }

  :state(skeleton),
  :host(:state(skeleton)) {
    --_line : var(--skeleton-line, 1em);
    --_gap  : var(--skeleton-gap, 0.5em);

    animation       : aufbau-skeleton 1.4s ease-in-out infinite;
    background      : repeating-linear-gradient(to bottom,
                        var(--skeleton-color, color-mix(in srgb, currentColor 14%, transparent)) 0 var(--_line),
                        transparent 0 calc(var(--_line) + var(--_gap)));
    border-radius   : var(--skeleton-radius, 0.25em);
    cursor          : progress;
    min-block-size  : calc(var(--skeleton-lines, 1) * (var(--_line) + var(--_gap)) - var(--_gap));
    min-inline-size : var(--skeleton-width, 4em);
    pointer-events  : none;
    user-select     : none;

    /* hides the host's own text. not color: transparent, the lines above are
       drawn from currentColor and would vanish with it */
    -webkit-text-fill-color : transparent;
  }

  :state(skeleton) > *,
  :host(:state(skeleton)) *,
  :host(:state(skeleton)) ::slotted(*) { visibility: hidden; }

  @media (prefers-reduced-motion: reduce) {
    :state(skeleton), :host(:state(skeleton)) { animation: none; }
  }
`;

const SKELETON_VARS = { gap: 'gap', line: 'line', lines: 'lines', radius: 'radius', width: 'width' };

export class AufbauCore extends HTMLElement {

  // every element takes `skeleton`, e.g. <aufbau-item skeleton> while an app loads its data
  static attr = { skeleton: Boolean };

  static styles = SKELETON_STYLES;


  constructor () {
    super();
    this._effects = disposer();
    this._mounted = false;

    // static shadow: true (or shadow root options) gives the element its own tree.
    // render() goes there, the children stay the author's and are projected by <slot>
    const shadow = this.constructor.shadow;
    if (shadow && !this.shadowRoot) this.attachShadow({ mode: 'open', ...(isPlainObject(shadow) ? shadow : {}) });

    // static source: the children are the element's input (markdown, code, a value).
    // they stay untouched in the light dom but are not displayed: a bare shadow root
    // only projects the output element, which is ours and lives in the light dom too,
    // so page css reaches everything that is shown
    else if (this.constructor.source && !this.shadowRoot) {
      this.attachShadow({ mode: 'open' }).innerHTML = '<slot name="output"></slot>';
    }

    // static internals: true attaches up front, an object also sets the default
    // semantics, e.g. { role: 'treeitem' }. without it internals attach on first use
    const defaults = this.constructor.internals;
    if (defaults && this.internals && isPlainObject(defaults)) Object.assign(this.internals, defaults);
  }

  /**
   * the element's ElementInternals, attached once on first access. null where
   * the browser or an ssr shim has none. form association still needs
   * `static formAssociated = true` on the class.
   */
  get internals () {
    if (this._internals === undefined) this._internals = this.attachInternals?.() ?? null;
    return this._internals;
  }

  /** custom states, styled as :state(name). add, delete, has, toggle(name, force) */
  get states () { return this._states ??= stateSet(this); }

  // the shadow root only counts as the element's tree with `static shadow`, the bare
  // outlet of `static source` holds nothing but a slot
  get root         () { return this.constructor.shadow && this.shadowRoot || this; }
  get renderTarget () { return this.output ?? this.root; }

  /** the focused element inside this one's tree, document.activeElement only sees the host */
  get focused () { return this.root === this ? document.activeElement : this.root.activeElement; }

  // :::::: SKELETON ::::::::::::::::::::::::::::::::::::::::::::

  /**
   * not named skeleton(): a framework setting the `skeleton` attribute as a prop
   * would find a property of that name and overwrite the method instead.
   *
   * shows or hides the placeholder while the element loads by itself. the
   * `skeleton` attribute shows it as well, either one is enough. the shape comes
   * from `static skeleton`: { lines, line, gap, width, radius }, or a function
   * returning that, called with the element as `this`.
   */
  setSkeleton (on = true) {
    this._skeleton = Boolean(on);
    this.syncSkeleton();
    return this;
  }

  syncSkeleton () {
    // most elements never show one, they must not even touch their internals for it
    const on = Boolean(this._skeleton || this.getAttr('skeleton'));
    if (!on && !this._skeletonShown) return;
    this._skeletonShown = on;

    this.states.toggle('skeleton', on);
    if (this.internals) this.internals.ariaBusy = on ? 'true' : null;

    const shape   = this.constructor.skeleton;
    const options = isFn(shape) ? shape.call(this) : (isPlainObject(shape) ? shape : {});
    for (const [key, name] of Object.entries(SKELETON_VARS)) {
      const value = on ? options[key] : undefined;
      if (value == null) this.style.removeProperty(`--skeleton-${name}`);
      else this.style.setProperty(`--skeleton-${name}`, String(value));
    }
  }

  // :::::: SOURCE ::::::::::::::::::::::::::::::::::::::::::::::

  /** the output element of a `static source` element, created once and appended as the last child */
  get output () {
    const source = this.constructor.source;
    if (!source) return null;

    if (!this._output) {
      this._output = document.createElement(source.tag ?? 'div');
      this._output.slot = 'output';
    }
    if (this._output.parentNode !== this) this.append(this._output);

    return this._output;
  }

  /** the author's children, everything but the output */
  get sourceNodes () { return [...this.childNodes].filter(node => node !== this._output); }

  /**
   * the children as source text: text nodes raw, elements as their markup. raw on
   * purpose, innerHTML would escape `>` and `<` and break markdown quotes and code
   */
  get sourceText () {
    return this.sourceNodes.map(node =>
        node.nodeType === Node.TEXT_NODE    ? node.data
      : node.nodeType === Node.ELEMENT_NODE ? node.outerHTML
      : ''
    ).join('');
  }

  // children added, removed or edited by the author (or a framework) re-render the output
  watchSource () {
    const observer = new MutationObserver(records => {
      const own = record => this._output && (record.target === this._output || this._output.contains(record.target)
        || (record.target === this && [...record.addedNodes, ...record.removedNodes].every(node => node === this._output)));
      if (records.some(record => !own(record))) this.onSourceChange();
    });
    observer.observe(this, { characterData: true, childList: true, subtree: true });
    this.track(() => observer.disconnect());
  }

  /** hook, the source changed. rebuilds by default */
  onSourceChange () { this.invalidate().update(); }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  connectedCallback () {
    this._mounted = true;
    // lazy on purpose: an imported but unused element must not adopt anything. a light
    // element adopts into the tree it sits in, the document or an enclosing shadow root
    adoptClassStyles(this.constructor, this.root === this ? this.getRootNode() : this.root);
    applySkin();
    this.on(window, CONFIG_EVENT, (event) => {
      if (this._mounted && this.observesConfig(event.detail?.changed)) this.update();
    });
    if (this.constructor.source) this.watchSource();
    this.onMount();
    this.update();
  }
  
  disconnectedCallback () {
    this._mounted = false;
    this.release();
    this.onUnmount();
  }

  attributeChangedCallback (name, oldValue, newValue) {
    // our own reflection writes (see reflectAttrs) are not a change of input
    if (this._reflecting) return;
    if (oldValue !== newValue && this._mounted) {
      this.onAttributeChange(name, oldValue, newValue);
      this.update();
    }
  }

  static init (name) {
    const tag = (isString(name) ? name : name?.name) || toKebabCase(this.name);

    if (!tag.includes('-')) return log.warn(`invalid tag name "${tag}", custom elements require a hyphen.`);
    if (customElements.get(tag)) return;

    // schema keys are already kebab-case, so they map 1:1 onto observedAttributes
    const observed = Object.keys(schemaOf(this));
    if (observed.length && !Object.getOwnPropertyDescriptor(this, 'observedAttributes')) {
      Object.defineProperty(this, 'observedAttributes', { configurable: true, get: () => observed });
    }

    customElements.define(tag, this);
  }

  // ::: hooks, override in subclasses

  onAttributeChange (name, oldValue, newValue) {}
  onMount   () {}
  onUnmount () {}
  onRender  () {}
  render    () { return null; }
  sync      () {}

  /**
   * the render pipeline. structure is only rebuilt when render() actually
   * produces different markup, otherwise every keystroke would drop focus and
   * caret position out of the inner fields. sync() runs on every pass,
   * onRender() only when the nodes are actually new.
   */
  update () {
    if (!this._mounted) return this;

    this.reflectAttrs();

    const markup = this.render();
    let rebuilt  = false;

    if (markup != null) {
      const next = String(markup);
      if (next !== this._markup) {
        this._markup = next;
        this.renderTarget.innerHTML = next;
        rebuilt = true;
      }
    }

    this.applyVars();
    this.syncSkeleton();
    this.sync();
    if (rebuilt) this.onRender();

    return this;
  }

  /**
   * `static reflect = ['look']` writes the RESOLVED value of those attributes
   * back onto the host: defaults, values from config and invalid values that
   * fell back. css can then select every state as [look="…"], the default and
   * a config driven one included. meant for presentation enums, not for values.
   */
  reflectAttrs () {
    const names = this.constructor.reflect;
    if (!isArray(names)) return this;

    for (const name of names) {
      const kebab = toKebabCase(name);
      const value = this.getAttr(name);
      const text  = value == null || value === false ? null : value === true ? '' : String(value);
      if (this.getAttribute(kebab) === text) continue;

      this._reflecting = true;
      try   { text === null ? this.removeAttribute(kebab) : this.setAttribute(kebab, text); }
      finally { this._reflecting = false; }
    }

    return this;
  }

  /** forces the next update() to rebuild the markup even if it is unchanged */
  invalidate () { this._markup = undefined; return this; }

  // :::::: CONFIG ::::::::::::::::::::::::::::::::::::::::::::::
  
  get schema () { return schemaOf(this.constructor); }
  get tag    () { return this.localName; }

  get configWatchlist () {
    if (this._configWatchlist !== undefined) return this._configWatchlist;

    const explicit = this.constructor.observedConfig;
    if (isArray(explicit)) return (this._configWatchlist = new Set(explicit.map(canonicalKey)));

    const keys = new Set;
    for (const [name, { config }] of Object.entries(this.schema)) {
      if (!config) continue;
      if (config === true) configKeys(this.tag, name).forEach(key => keys.add(canonicalKey(key)));
      else config.forEach(key => keys.add(canonicalKey(key)));
    }

    return (this._configWatchlist = keys.size ? keys : null);
  }

  observesConfig (changed) {
    const watchlist = this.configWatchlist;
    if (!watchlist || !isArray(changed)) return true;
    return changed.some(key => watchlist.has(canonicalKey(key)));
  }

  getConfig (name, fallback, keys = true) {
    const kebab = toKebabCase(name);
    if (this.hasAttribute(kebab)) return this.getAttribute(kebab);

    const found = resolveConfig(this.tag, kebab, keys);
    return found === undefined ? fallback : found;

    //return this.getAttr(name) ?? resolveConfig(this.tag, name) ?? fallback;
  }

  // resolved gesture mode for this element — 'auto' | 'true' | 'false'.
  // precedence: the element's own `gestures` attribute,
  // then a tag-scoped config (`<tag>-gestures`), 
  // then the global `gestures` config, 
  // then 'auto'. elements that carry gesture behaviour consult this,
  // so a page can switch every gesture off 
  // with a single `<aufbau-config gestures="false">` (or per element / tag).
  gesturesMode () {
    return String(this.getConfig('gestures', 'auto', [...configKeys(this.tag, 'gestures'), 'gestures']));
  }

  // :::::: EVENTS ::::::::::::::::::::::::::::::::::::::::::::::

  on (...args) {
    const [first, second, third, fourth] = args;

    // delegated: type first, selector second. dom.delegate takes
    // (container, types, selector, fn), so the order carries straight through
    // with a shadow root the delegation runs twice: on the host for the author's
    // children, on the root for the own parts. events from inside are retargeted
    // to the host on the way out, so the host alone could never match them
    if (isString(first) && isString(second) && isFn(third)) {
      const stops = [delegateEvent(this, first, second, third, fourth)];
      if (this.root !== this) stops.push(delegateEvent(this.root, first, second, third, fourth));
      return this.track(() => stops.forEach(stop => stop()));
    }

    // the element itself
    if (isString(first) && isFn(second)) {
      return this.track(onEvent(this, first, second, third));
    }

    // any external event target or iterable of targets
    if (!first) return () => {};
    return this.track(onEvent(first, second, third, fourth));
  }

  off  (...args) { offEvent(this, ...args); return this; }
  emit (...args) { return emitEvent(this, ...args); }

  onOutside (handler, { type = 'pointerdown' } = {}) {
    return this.on(document, type, (event) => {
      if (!event.composedPath().includes(this)) handler(event);
    });
  }

  release ()            { this._effects.dispose(); return this; }
  track   (unsubscribe) { return this._effects.add(unsubscribe); }

  // :::::: ATTRIBUTES ::::::::::::::::::::::::::::::::::::::::::

  hasAttr (name) { return hasAttr(this, name); }
  setAttr (map)  { setAttr(this, map); return this; }

  getAttr (nameOrType, type, fallback) {
    if (!isString(nameOrType)) return this._attrProxy(isFn(nameOrType) ? nameOrType : null);

    const kebab  = toKebabCase(nameOrType);
    const parsed = this.schema[kebab] ?? BASE;

    const finalType     = isFn(type)          ? type     : parsed.type;
    const finalFallback = isDefined(fallback) ? fallback : parsed.fallback;
    const fromConfig    = () => parsed.config ? resolveConfig(this.tag, kebab, parsed.config) : undefined;

    // booleans: attribute presence first, then config, then fallback
    if (finalType === Boolean) {
      if (this.hasAttribute(kebab)) return true;
      const configured = fromConfig();
      return configured === undefined ? (finalFallback ?? false) : toBoolean(configured);
    }

    const raw = this.hasAttribute(kebab) ? this.getAttribute(kebab) : fromConfig();
    if (raw == null) return finalFallback;

    let value = coerce(raw, finalType, finalFallback);

    if (parsed.values && !parsed.values.includes(value)) value = finalFallback;

    if (parsed.fn) {
      try   { value = parsed.fn.call(this, value, nameOrType); }
      catch { value = finalFallback; }
    }

    return value;
  }

  _attrProxy (overrideType) {
    const names = Object.keys(this.schema);

    return new Proxy({}, {
      get     : (target, prop) => isString(prop) ? this.getAttr(prop, overrideType) : undefined,
      has     : (target, prop) => isString(prop) && this.hasAttr(prop),
      ownKeys : () => names.map(toCamelCase),
      getOwnPropertyDescriptor: () => ({ configurable: true, enumerable: true }),
    });
  }

  // :::::: STYLE VARS :::::::::::::::::::::::::::::::::::::::::::
  // css custom properties on the element, the getAttr/setAttr counterpart.
  // names are managed: a leading `--` is optional and the `varPrefix` config
  // (default 'aufbau') is inserted, so `item-size` -> `--aufbau-item-size`.
  // get reads the resolved value.

  // '' when disabled, else the prefix segment ('aufbau' by default)
  varPrefix () {
    const raw = this.getConfig('varPrefix', 'aufbau', [...configKeys(this.tag, 'varPrefix'), 'var-prefix']);
    return raw === false || raw === 'false' ? '' : raw === true || raw === 'true' ? 'aufbau' : String(raw);
  }

  cssVar (name) {
    const base   = name.startsWith('--') ? name.slice(2) : name;
    const prefix = this.varPrefix();
    return `--${prefix && base !== prefix && !base.startsWith(`${prefix}-`) ? `${prefix}-${base}` : base}`;
  }

  getVar (name, fallback) {
    const value = getComputedStyle(this).getPropertyValue(this.cssVar(name)).trim();
    return value || fallback;
    //return getStyleToken(name, this) || fallback;
  }

  getVars (names = []) {
    const style = getComputedStyle(this);
    const out   = {};
    for (const name of names) out[name] = style.getPropertyValue(this.cssVar(name)).trim() || undefined;
    //for (const name of names) out[name] = this.getVar(name);
    return out;
  }

  setVar (name, value) {
    if (isBlank(value)) this.style.removeProperty(this.cssVar(name));
    else this.style.setProperty(this.cssVar(name), String(value));
    return this;
  }

  setVars (map) {
    for (const name in map) this.setVar(name, map[name]);
    return this;
  }

  // reflect every `var`-flagged attribute onto its css custom property
  applyVars () {
    for (const [name, entry] of Object.entries(this.schema)) {
      const key = entry.var === true ? name : entry.var;
      if (entry.var) this.setVar(key, this.getAttr(name));
    }
  }
  

  // :::::: CHILDREN REFS :::::::::::::::::::::::::::::::::::::::

  get $ () {
    const root    = this.root;
    const findOne = spec => decorate(getElement(spec, root));
  
    return new Proxy(findOne, {
      apply: (target, thisArg, args) => findOne(...args),
      get (target, prop) {
        if (prop in target)  return target[prop];
        if (!isString(prop)) return undefined;
        const element = getElementById(toKebabCase(prop), root) ?? getElementById(prop, root);
        return decorate(element);
      }
    });
  }
  
  get $$ () {
    return spec => decorateAll(getElements(spec, this.root));
  }

}

export default AufbauCore;

/*

-- configWatchlist()
config keys this element depends on. null means: react to any change.
stored in the config store's canonical form, because that is the form the change list arrives in

-- onOutside
fires when an interaction happens anywhere but inside this element.
composedPath() is used on purpose, it sees through shadow roots.

-- onRender()
runs after a real markup rebuild only, for work that rewrites the new nodes

-- render()
structure, without values. return null to opt out of markup entirely

-- renderTarget()
where render() output goes: the shadow root with `static shadow`, the element
itself otherwise. an element never renders over children the author owns.
anything with its own structure AND authored children declares `static shadow`
and projects the children through <slot>, like a native element would.

-- root()
shadow root when present, the element itself otherwise 

-- sync()
values and state, applied to the structure render() produced

*/
