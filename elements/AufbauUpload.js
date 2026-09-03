// <aufbau-upload>
// file intake. `accept` rather than `mimetype`, because the native attribute is
// a superset: it takes mimetypes ("image/*") as well as extensions (".pdf").

import { AufbauControl } from './core/index.js';
import { attrs, html } from './core/html.js';

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

  static styles = `
    aufbau-upload { display: block; }

    aufbau-upload .aufbau-upload-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--aufbau-control-gap, 0.5em);
    }

    aufbau-upload .upload-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--aufbau-control-gap, 0.5em);
      padding: 1.5em 1em;
      text-align: center;
      cursor: pointer;
    }

    aufbau-upload .look-button .upload-zone {
      flex-direction: row;
      padding: var(--aufbau-control-pad, 0.35em 0.55em);
    }

    aufbau-upload .look-list .upload-zone { display: none; }

    aufbau-upload .upload-icon { --icon-size: 1.75em; flex: none; }

    aufbau-upload .upload-list {
      display: flex;
      flex-direction: column;
      gap: 0.25em;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    aufbau-upload .upload-item {
      display: flex;
      align-items: center;
      gap: var(--aufbau-control-gap, 0.5em);
    }

    aufbau-upload .upload-name {
      flex: 1 1 auto;
      min-inline-size: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    aufbau-upload .upload-size {
      flex: none;
      opacity: 0.65;
      font-variant-numeric: tabular-nums;
    }

    aufbau-upload .upload-remove {
      display: inline-flex;
      align-items: center;
      flex: none;
      margin: 0;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
  `;

  // keeps authored children (a custom label, hints) alive across repaints
  get renderTarget () { return this.shell('aufbau-upload-ui'); }

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
    this.on('change', '.upload-field', (event, input) => this.add([...input.files]));
    this.on('click',  '.upload-zone',  () => { if (!this.isDisabled) this.$('.upload-field')?.click(); });
    this.on('click',  '[data-remove]', (event, button) => {
      event.stopPropagation();
      this.remove(Number(button.dataset.remove));
    });

    for (const type of ['dragenter', 'dragover']) {
      this.on(type, (event) => {
        if (this.isDisabled) return;
        event.preventDefault();
        this.classList.add('is-dragging');
      });
    }

    for (const type of ['dragleave', 'drop']) {
      this.on(type, (event) => {
        event.preventDefault();
        this.classList.remove('is-dragging');
        if (type === 'drop' && !this.isDisabled) this.add([...(event.dataTransfer?.files ?? [])]);
      });
    }
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
    const internals = this._internals;
    if (!internals) return this;

    const anchor = this.$('.upload-zone') ?? this;

    if (this._rejected?.length) internals.setValidity({ typeMismatch: true }, 'one or more files were rejected.', anchor);
    else if (this.getAttr('required') && !this.files.length) {
      internals.setValidity({ valueMissing: true }, 'please select a file.', anchor);
    }
    else internals.setValidity({});

    return this;
  }

  // :::::: RENDER ::::::::::::::::::::::::::::::::::::::::::::::

  render () {
    const { accept, directory, look, multiple, text } = this.getAttr();

    return html`
      <div class="aufbau-upload-wrapper look-${look}">
        <input class="upload-field" type="file" hidden ${attrs({
          accept,
          multiple,
          webkitdirectory : directory,
        })} />

        <div class="upload-zone" role="button" tabindex="0">
          <aufbau-icon icon="lucide:upload" class="upload-icon"></aufbau-icon>
          <span class="upload-text">${text}</span>
        </div>

        ${this.files.length > 0 && html`
          <ul class="upload-list">
            ${this.files.map((file, index) => html`
              <li class="upload-item">
                <span class="upload-name">${file.name}</span>
                <span class="upload-size">${formatSize(file.size)}</span>
                <button type="button" class="upload-remove" data-remove="${index}" aria-label="remove ${file.name}">
                  <aufbau-icon icon="lucide:x"></aufbau-icon>
                </button>
              </li>
            `)}
          </ul>
        `}
      </div>
    `;
  }

  sync () {
    super.sync();
    this.classList.toggle('has-files', this.files.length > 0);
  }
}

AufbauUpload.init();
