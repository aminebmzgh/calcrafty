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
    // SEO: every Lighthouse SEO audit must pass except "is-crawlable", because draft and embed pages are
    // noindex on purpose (content status gates indexing). validate-seo checks indexability against status.
    ...Object.fromEntries(
      ["document-title", "meta-description", "http-status-code", "link-text", "crawlable-anchors", "canonical", "hreflang", "image-alt", "robots-txt"].map((a) => [a, ["error", { minScore: seo }]]),
    ),
    'largest-contentful-paint': ['error', { maxNumericValue: lcp, aggregationMethod: 'median' }],
    'cumulative-layout-shift': ['error', { maxNumericValue: cls, aggregationMethod: 'median' }],
    'total-blocking-time': ['error', { maxNumericValue: 150, aggregationMethod: 'median' }],
  };
}

module.exports = { lhciUrls, assertions };
