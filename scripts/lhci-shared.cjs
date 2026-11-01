// Shared Lighthouse CI settings: one URL per page type, budget assertions.
const fs = require('node:fs');
const path = require('node:path');

function exists(dir, url) {
  return fs.existsSync(path.join(dir, url, 'index.html'));
}

function firstMatch(dir, base, re) {
  const root = path.join(dir, base);
  if (!fs.existsSync(root)) return null;
  for (const name of fs.readdirSync(root).sort()) {
    const url = `${base}${name}/`;
    if (re.test(url) && exists(dir, url)) return url;
  }
  return null;
}

function lhciUrls(dir) {
  const urls = ['/', '/finance/', '/finance/mortgage-calculator/', '/finance/mortgage-calculator/texas/', '/finance/mortgage-calculator/states/', '/about/'];
  const guide = firstMatch(dir, '/guides/', /^\/guides\/[^/]+\/$/);
  const embed = firstMatch(dir, '/embed/', /^\/embed\/[^/]+\/$/);
  for (const u of [guide, embed]) if (u) urls.push(u);
  for (const cat of ['/health/', '/math/', '/everyday/']) {
    const calc = firstMatch(dir, cat, /calculator\/$/);
    if (calc) urls.push(calc);
  }
  return urls.filter((u) => exists(dir, u)).map((u) => `http://localhost${u}`);
}

function assertions({ perf, a11y, bp, seo, lcp, cls }) {
  return {
    'categories:performance': ['error', { minScore: perf }],
    'categories:accessibility': ['error', { minScore: a11y }],
    'categories:best-practices': ['error', { minScore: bp }],
    // Embed and 404 pages are noindex by design, which Lighthouse SEO penalizes; those are checked via validate-seo.
    'categories:seo': ['error', { minScore: seo, aggregationMethod: 'median-run' }],
    'largest-contentful-paint': ['error', { maxNumericValue: lcp }],
    'cumulative-layout-shift': ['error', { maxNumericValue: cls }],
    'total-blocking-time': ['error', { maxNumericValue: 150 }],
  };
}

module.exports = { lhciUrls, assertions };
