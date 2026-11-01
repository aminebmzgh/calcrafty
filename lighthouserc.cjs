// Lighthouse CI, ads OFF profile (docs/BUILD-BRIEF.md section 16). Mobile emulation is Lighthouse's default.
const { lhciUrls, assertions } = require('./scripts/lhci-shared.cjs');

module.exports = {
  ci: {
    collect: { staticDistDir: './dist', url: lhciUrls('./dist'), numberOfRuns: 3 },
    assert: { assertions: assertions({ perf: 0.98, a11y: 0.98, bp: 1, seo: 1, lcp: 1500, cls: 0.02 }) },
    upload: { target: 'filesystem', outputDir: './.lighthouseci/ads-off' },
  },
};
