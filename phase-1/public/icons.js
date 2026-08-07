/* Icon loader — replaces <i data-icon="name"> with inline SVG from assets/icons/{name}.svg.
   Icons inherit color via currentColor and size via CSS on the host element. */
(function () {
  const cache = new Map();

  function normalize(svg) {
    return svg
      .replace(/\sfill="#[0-9a-fA-F]{3,8}"/g, ' fill="currentColor"')
      .replace(/\sstroke="#[0-9a-fA-F]{3,8}"/g, ' stroke="currentColor"')
      .replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1')
      .replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1');
  }

  async function fetchIcon(name) {
    if (cache.has(name)) return cache.get(name);
    const p = fetch(`assets/icons/${encodeURIComponent(name)}.svg`)
      .then(r => r.ok ? r.text() : '')
      .then(t => t ? normalize(t) : '');
    cache.set(name, p);
    return p;
  }

  async function renderOne(el) {
    const name = el.getAttribute('data-icon');
    if (!name || el.dataset.iconLoaded) return;
    const svg = await fetchIcon(name);
    if (!svg) return;
    el.innerHTML = svg;
    el.dataset.iconLoaded = '1';
    const s = el.firstElementChild;
    if (s && s.tagName.toLowerCase() === 'svg') {
      s.setAttribute('aria-hidden', 'true');
      s.style.display = 'block';
      s.setAttribute('width', '100%');
      s.setAttribute('height', '100%');
    }
  }

  function renderAll(root = document) {
    root.querySelectorAll('[data-icon]:not([data-icon-loaded])').forEach(renderOne);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderAll());
  } else {
    renderAll();
  }

  window.Icons = { render: renderAll, renderOne };
})();
