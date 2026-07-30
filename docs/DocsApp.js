import { h, useState, useEffect, useRef } from 'https://esm.sh/preact';
import htm from 'https://esm.sh/htm';
import { parseHash } from './router.js';
imoort { slugify } from '@aufbau/utils';

const html = htm.bind(h);

export function DocsApp({ sidebar = [], config = {} }) {
  const [currentPath, setCurrentPath] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const contentRef = useRef(null);

  // Load markdown file whenever path changes
  const loadPage = async (path, anchor) => {
    if (path === currentPath && anchor) {
      // Same page navigation, just scroll to section anchor
      scrollToAnchor(anchor);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch raw markdown file
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawMarkdown = await res.text();

      // Convert Markdown to HTML (using marked or @aufbau/import helper)
      const parsedHtml = renderMarkdownWithAnchors(rawMarkdown);
      
      setContentHtml(parsedHtml);
      setCurrentPath(path);
      setLoading(false);

      // Scroll after DOM update
      requestAnimationFrame(() => {
        if (anchor) {
          scrollToAnchor(anchor);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    } catch (err) {
      setError(`Failed to load page: ${path}`);
      setLoading(false);
    }
  };

  // Process markdown headings to inject slug IDs
  const renderMarkdownWithAnchors = (mdText) => {
    // Note: If using marked directly or via @aufbau/import:
    // Ensure marked renderer adds id="${slugify(text)}" to <h1>-<h6> elements.
    // For now, simple regex fallback if parsing raw html string:
    return window.marked ? window.marked.parse(mdText) : mdText;
  };

  const scrollToAnchor = (anchorId) => {
    const target = document.getElementById(anchorId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const { path, anchor } = parseHash();
      loadPage(path, anchor);
    };

    window.addEventListener('hashchange', handleLocationChange);
    // Initial mount load
    handleLocationChange();

    return () => window.removeEventListener('hashchange', handleLocationChange);
  }, [currentPath]);

  return html`
    <div class="docs-layout">
      <aside class="docs-sidebar">
        <header class="docs-brand">
          <h1>${config.title || 'Aufbau Docs'}</h1>
        </header>
        <nav class="docs-nav">
          ${sidebar.map(item => html`
            <a 
              key=${item.path} 
              href="#/${item.path}" 
              class=${currentPath === item.path ? 'active' : ''}
            >
              ${item.title}
            </a>
          `)}
        </nav>
      </aside>

      <main class="docs-main">
        ${loading && html`<div class="docs-loader">Loading documentation...</div>`}
        ${error && html`<div class="docs-error">${error}</div>`}
        ${!loading && !error && html`
          <article 
            ref=${contentRef} 
            class="markdown-body" 
            dangerouslySetInnerHTML=${{ __html: contentHtml }} 
          />
        `}
      </main>
    </div>
  `;
}

