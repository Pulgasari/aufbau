// /docs/index.js

// :::::: IMPORTS
import hljs from 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/+esm';
import aufbau, { html, Fragment, useSignalEffect } from '@aufbau/kit';

aufbau.init();
// Service Worker Registration
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register(new URL('./sw.js', import.meta.url), { type: 'module' })
    .catch(err => console.error(err));
}

// :::::: CONFIGURATION & SIGNALS

const docsConfig = {
  title: '@aufbau docs',
  sidebar: [
    { title: 'Overview'   , path: 'readme.md' },
    { title: 'Kit'        , path: 'kit/readme.md' },
    { title: 'Stylesheet' , path: 'stylesheet/readme.md' },
    { title: 'Shaders'    , path: 'shaders/readme.md' },
  ]
};

// Global App Signals
const currentRoute = aufbau.signal(parseHash());
const mdContent    = aufbau.signal('');
const tocList      = aufbau.signal([]);
const isLoading    = aufbau.signal(true);
const errorMessage = aufbau.signal(null);

// :::::: ROUTER & TOC HELPERS

/**
 * Extract path and heading anchor from URL hash.
 * Example: "#/kit/readme.md#installation" -> { path: "kit/readme.md", anchor: "installation" }
 */
function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return { path: 'readme.md', anchor: null };

  const [path, anchor] = hash.split('#');
  return { path: path || 'readme.md', anchor: anchor || null };
}

/**
 * Parse HTML string, ensure all headings have slug IDs, and extract TOC items.
 */
function processHtmlAndBuildToc(htmlContent) {
  const parser   = new DOMParser();
  const doc      = parser.parseFromString(htmlContent, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const toc      = [];

  headings.forEach((h, index) => {
    const level = parseInt(h.tagName.substring(1), 10);
    const text  = h.textContent || '';
    
    // Assign slug ID to heading if not present
    let id = h.id;
    if (!id) {
      id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-') || `heading-${index}`;
      h.id = id;
    }

    toc.push({ id, text, level });
  });

  return {
    processedHtml: doc.body.innerHTML,
    toc
  };
}

// Listen for hash changes
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    currentRoute.value = parseHash();
  });
}

// :::::: REACTION & DATA FETCHING

// Fetch markdown and re-build TOC whenever route path changes
aufbau.effect(() => {
  const { path, anchor } = currentRoute.value;

  async function loadDocument() {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      // Import and render Markdown via @aufbau/import
      const rawHtml = await aufbau.import(`./${path}`);
      const { processedHtml, toc } = processHtmlAndBuildToc(rawHtml);

      mdContent.value = processedHtml;
      tocList.value   = toc;
      isLoading.value = false;

      // Handle smooth scrolling after DOM render
      requestAnimationFrame(() => {
        // Trigger highlight.js for code blocks
        document.querySelectorAll('pre code').forEach(block => {
          hljs.highlightElement(block);
        });

        if (anchor) {
         document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    } catch (err) {
      console.error('[Docs Loader Error]:', err);
      errorMessage.value = `Failed to load document: ${path}`;
      isLoading.value = false;
    }
  }

  loadDocument();
});

// :::::: COMPONENTS

function Header() {
  return html`
    <header id="app-header">
      <div class="brand">${docsConfig.title}</div>
    </header>
  `;
}

function Sidebar() {
  const activePath = currentRoute.value.path;

  return html`
    <aside class="docs-sidebar">
      <nav class="docs-nav">
        ${docsConfig.sidebar.map(item => html`
          <a 
            key=${item.path} 
            href="#/${item.path}" 
            class=${activePath === item.path ? 'active' : ''}
          >
            ${item.title}
          </a>
        `)}
      </nav>
    </aside>
  `;
}

function TableOfContents() {
  const items = tocList.value;
  const currentPath = currentRoute.value.path;

  if (!items.length) return null;

  return html`
    <aside class="docs-toc">
      <h4>On This Page</h4>
      <nav>
        ${items.map(item => html`
          <a 
            key=${item.id} 
            href="#/${currentPath}#${item.id}"
            class=${`toc-item level-${item.level}`}
          >
            ${item.text}
          </a>
        `)}
      </nav>
    </aside>
  `;
}

function Main() {
  if (isLoading.value) {
    return html`<div class="docs-status">Loading documentation...</div>`;
  }

  if (errorMessage.value) {
    return html`<div class="docs-status error">${errorMessage.value}</div>`;
  }

  return html`
    <div class="docs-body-wrapper">
      <article 
        class="markdown-body" 
        dangerouslySetInnerHTML=${{ __html: mdContent.value }} 
      />
      <${TableOfContents} />
    </div>
  `;
}

function Footer() {
  return html`
    <footer id="app-footer">
      <span>aufbau | 2026</span>
    </footer>
  `;
}

function App() {
  return html`
    <${Fragment}>
      <${Header} />
      <div id="app-body">
        <${Sidebar} />
        <main class="docs-main-content">
          <${Main} />
        </main>
      </div>
      <${Footer} />
    </${Fragment}>
  `;
}

// :::::: MOUNT ENGINE

const $app = document.getElementById('app');
aufbau.render(html`<${App} />`, $app);








/*
// aufbau/docs/index.js

// :::::: CONFIG

const base = 'https://pulgasari.github.io/aufbau/docs/';

// :::::: IMPORTS

import hljs from 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/+esm';

// ::: aufbau
import aufbau, { html, useRef, useSignal, useSignalEffect, Fragment } from '@aufbau/kit';
window.html = html; aufbau.init();
// Register local Service Worker for network stylesheets
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register(new URL('./sw.js', import.meta.url), { type: 'module' })
    .then  (reg => console.log(reg.scope))
    .catch (err => console.error(err));
}


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
    const jsonState = aufbau.signal(null);
    const   mdState = aufbau.signal('Lade Markdown...');

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
*/
