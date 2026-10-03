import { AufbauElement } from './AufbauElement.js';

// the children are the input (markdown, code), the rendered result goes into an
// output element next to them. static output names its tag
export const withSource = Base => class AufbauSource extends Base {

  static output = 'div';

  constructor () {
    super();
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' }).innerHTML = '<slot name="output"></slot>';
  }

  get output () {
    if (!this._output) {
      this._output = document.createElement(this.constructor.output);
      this._output.slot = 'output';
    }
    if (this._output.parentNode !== this) this.append(this._output);

    return this._output;
  }

  get renderTarget () { return this.output; }

  // the author's children, everything but the output
  get sourceNodes () { return [...this.childNodes].filter(node => node !== this._output); }

  get sourceText () {
    return this.sourceNodes.map(node => {
      if (node.nodeType === Node.TEXT_NODE)    return node.data;
      if (node.nodeType === Node.ELEMENT_NODE) return node.outerHTML;
      return '';
    }).join('');
  }

  connectedCallback () {
    super.connectedCallback();
    this.watchSource();
  }

  watchSource () {
    const isSource = node => this.sourceNodes.some(source => source === node || source.contains(node));
    const counts   = record => record.target === this
      ? [...record.addedNodes, ...record.removedNodes].some(node => node !== this._output)
      : isSource(record.target);

    const observer = new MutationObserver(records => { if (records.some(counts)) this.onSourceChange(); });
    observer.observe(this, { characterData: true, childList: true, subtree: true });
    this.track(() => observer.disconnect());
  }

  // hook, the source changed. rebuilds by default
  onSourceChange () { this.invalidate().update(); }
};

export const AufbauSourceElement = withSource(AufbauElement);

export default AufbauSourceElement;
