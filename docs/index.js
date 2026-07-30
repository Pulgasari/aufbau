// aufbau/docs/index.js

// :::::: CONFIG

const base = 'https://pulgasari.github.io/aufbau/docs/';

// :::::: IMPORTS

// ::: aufbau
import aufbau, { html, useRef, useSignal, useSignalEffect, Fragment } from '@aufbau/kit';
window.html = html; aufbau.init();
// Register local Service Worker for network stylesheets
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register(new URL('./sw.js', import.meta.url), { type: 'module' })
    .then  (reg => console.log(reg.scope))
    .catch (err => console.error(error));
}

// ::: misc
import hljs from 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/+esm';

// ::: components
//import Footer from './components/Footer.js';
//import Header from './components/Header.js';

function Link ({ href, label, children }) {
  href = href.startsWith('https://') ? href : (base + href);
  return html `<a href=${href}>${children || label}</a>`;
}

function Header () {
  return html `
    <div id='app-header'>
      aufbau/docs
      <nav>
        <${Link} href='docs' label='Docs'/>
      </nav>
    </div>
  `;
}

function Footer () {
  return html `
    <div id='app-footer'>
      <span>aufbau | 2026</span>
    </div>
  `;
}


    // 2. @aufbau/import Test Suite
    const jsonState = signal(null);
    const   mdState = signal('Lade Markdown...');

    async function runImportTests() {
      try {
        // test: index.jsonc
        const jsonData = await aufbau.import('./index.jsonc');
        jsonState.value = jsonData;

        // test: readme.md
        const mdHtml = await aufbau.import('./readme.md');
        mdState.value = mdHtml;
      } catch (err) {
        console.error('[Import Test Error]:', err);
      }
    }

    runImportTests();

function Main() {
      return html`
        <div>
          <h2>@aufbau/import Test Results</h2>

          <section>
            <h3>JSONC Data (.jsonc)</h3>
            <pre>${JSON.stringify(jsonState.value, null, 2)}</pre>
          </section>

          <section>
            <h3>Rendered Markdown (.md)</h3>
            <div dangerouslySetInnerHTML=${{ __html: mdState.value }}></div>
          </section>
        </div>
      `;
}

function App () {
  return html`<${Fragment}>
    <${Header}/>
    <div id='app-body'><${Main}/></div>
    <${Footer}/>
  </${Fragment}>`;
}   
    
const $body    = document.body;
const $app     = document.getElementById('app');
const $appBody = document.getElementById('app-body');

aufbau.render(html`<${App}/>`, $app);
