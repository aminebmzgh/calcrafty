// Lighthouse CI, ads ON profile: run against dist-ads/ (built with ADS_ENABLED=true by `npm run build:ads`).
const { lhciUrls, assertions } = require('./scripts/lhci-shared.cjs');

module.exports = {
  ci: {
    collect: { staticDistDir: './dist-ads', url: lhciUrls('./dist-ads'), numberOfRuns: 2 },
    assert: { assertions: assertions({ perf: 0.9, a11y: 0.98, bp: 0.95, seo: 1, lcp: 2000, cls: 0.05 }) },
    upload: { target: 'filesystem', outputDir: './.lighthouseci/ads-on' },
  },
};
