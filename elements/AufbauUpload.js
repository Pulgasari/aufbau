// <aufbau-upload>
// file intake. `accept` rather than `mimetype`, because the native attribute is
// a superset: it takes mimetypes ("image/*") as well as extensions (".pdf").

import { AufbauControl }  from './core/index.js';
import { attrs, html, raw } from './core/html.js';

const UNITS = ['B', 'KB', 'MB', 'GB'];

const formatSize = (bytes) => {
  let size = Number(bytes) || 0, unit = 0;
  while (size >= 1024 && unit < UNITS.length - 1) { size /= 1024; unit++; }
  return `${size < 10 && unit ? size.toFixed(1) : Math.round(size)} ${UNITS[unit]}`;
};

// "image/*, .pdf" -> matches image/png and report.pdf
const matches = (file, accept) => {
  if (!accept) return true;
  return accept.split(',').map(part => part.trim().toLowerCase()).filter(Boolean).some(rule =>
      rule.startsWith('.')    ? file.name.toLowerCase().endsWith(rule)
    : rule.endsWith('/*')     ? file.type.startsWith(rule.slice(0, -1))
    :                           file.type.toLowerCase() === rule
  );
};

export default class AufbauUpload extends AufbauControl {
  static attr = {
    accept    : String,
    directory : Boolean,
    look      : { type: String, default: 'dropzone', values: ['dropzone', 'button', 'list'] },
    maxSize   : Number,
    multiple  : Boolean,
    text      : 'drop files here or click to browse',
  };

  // children: the hidden native file input, a <button> as drop zone and file
  // dialog trigger, and a <ul> of the picked files. state: :state(dragging),
  // :state(filled)
  static styles = `aufbau-upload {
    display        : flex;
    flex-direction : column;
    gap            : var(--aufbau-control-gap, 0.5em);

    > button {
      align-items     : center;
      background      : none;
      color           : inherit;
      cursor          : pointer;
      display         : flex;
      flex-direction  : column;
      font            : inherit;
      gap             : var(--aufbau-control-gap, 0.5em);
      justify-content : center;
      margin          : 0;
      padding         : 1.5em 1em;
      text-align      : center;

      > aufbau-icon { --icon-size: 1.75em; }
    }

    &[look="button"] > button {
      flex-direction : row;
      padding        : var(--aufbau-control-pad, 0.35em 0.55em);
    }

    &[look="list"] > button { display: none; }

    > ul {
      display        : flex;
      flex-direction : column;
      gap            : 0.25em;
      list-style     : none;
      margin         : 0;
      padding        : 0;
    }

    li {
      align-items : center;
      display     : flex;
      gap         : var(--aufbau-control-gap, 0.5em);

      > span {
        flex            : 1 1 auto;
        min-inline-size : 0;
        overflow        : hidden;
        text-overflow   : ellipsis;
        white-space     : nowrap;
      }

      > small {
        flex                 : none;
        font-size            : inherit;
        font-variant-numeric : tabular-nums;
        opacity              : 0.65;
      }

      > button {
        align-items : center;
        background  : none;
        border      : 0;
        color       : inherit;
        cursor      : pointer;
        display     : inline-flex;
        flex        : none;
        font        : inherit;
        margin      : 0;
        padding     : 0;
      }
    }
  }`;

  get files () { return this._files ??= []; }

  /** a file control submits FormData, one entry per file */
  get formValue () {
    const { name } = this.getAttr();
    if (!this.files.length || !name) return null;

    const data = new FormData;
    for (const file of this.files) data.append(name, file, file.name);
    return data;
  }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  onMount () {
    // authored children replace the default text of the drop zone
    this._children ??= this.innerHTML.trim();

    this.on('change', ':scope > input', (event, input) => this.add([...input.files]));
    this.on('click',  ':scope > button', () => { if (!this.isDisabled) this.field?.click(); });
    this.on('click',  '[data-remove]',   (event, button) => this.remove(Number(button.dataset.remove)));

    this.on('dragenter dragover', (event) => {
      if (this.isDisabled) return;
      event.preventDefault();
      this.states.toggle('dragging', true);
    });

    // dragleave also fires when the pointer moves onto a child, only leaving the host counts
    this.on('dragleave', (event) => {
      if (!this.contains(event.relatedTarget)) this.states.toggle('dragging', false);
    });

    this.on('drop', (event) => {
      event.preventDefault();
      this.states.toggle('dragging', false);
      if (!this.isDisabled) this.add([...(event.dataTransfer?.files ?? [])]);
    });
  }

  // :::::: FILES :::::::::::::::::::::::::::::::::::::::::::::::

  add (incoming) {
    const { accept, maxSize, multiple } = this.getAttr();

    const accepted = [];
    const rejected = [];

    for (const file of incoming) {
      if (!matches(file, accept))         rejected.push({ file, reason: 'type' });
      else if (maxSize && file.size > maxSize) rejected.push({ file, reason: 'size' });
      else accepted.push(file);
    }

    this._files   = multiple ? [...this.files, ...accepted] : accepted.slice(0, 1);
    this._rejected = rejected;

    if (rejected.length) this.emit('aufbau-upload-rejected', { rejected });

    this.commitFiles();
    return this;
  }

  remove (index) {
    this._files = this.files.filter((file, at) => at !== index);
    this.commitFiles();
    return this;
  }

  clear () { this._files = []; this.commitFiles(); return this; }

  /** files are not an attribute, so the value path is form state + events only */
  commitFiles () {
    this.invalidate().update();
    this.notify();
    this.emit('aufbau-upload', { files: this.files });
    return this;
  }

  formResetCallback () { this._files = []; this._rejected = []; this.invalidate().update(); }

  validate () {
    const internals = this.internals;
    if (!internals) return this;

    const anchor = this.$(':scope > button') ?? this;

    if (this._rejected?.length) internals.setValidity({ typeMismatch: true }, 'one or more files were rejected.', anchor);
    else if (this.getAttr('required') && !this.files.length) {
      internals.setValidity({ valueMissing: true }, 'please select a file.', anchor);
    }
    else internals.setValidity({});

    return this;
  }

  // :::::: RENDER ::::::::::::::::::::::::::::::::::::::::::::::

  render () {
    const { accept, directory, multiple, text } = this.getAttr();

    return html`
      <input type="file" hidden ${attrs({ accept, multiple, webkitdirectory: directory })} />
      <button type="button">
        <aufbau-icon icon="lucide:upload"></aufbau-icon>
        <span>${this._children ? raw(this._children) : text}</span>
      </button>
      ${this.files.length > 0 && html`
        <ul>
          ${this.files.map((file, index) => html`
            <li>
              <span>${file.name}</span>
              <small>${formatSize(file.size)}</small>
              <button type="button" data-remove="${index}" aria-label="remove ${file.name}">
                <aufbau-icon icon="lucide:x"></aufbau-icon>
              </button>
            </li>
          `)}
        </ul>
      `}
    `;
  }

  sync () {
    super.sync();
    this.states.toggle('filled', this.files.length > 0);
  }
}

AufbauUpload.init();
