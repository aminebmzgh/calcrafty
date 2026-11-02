/**
 * Permanent (301) redirects, written into dist/.htaccess at build time.
 * `from` and `to` are root-relative paths. Add an entry whenever a URL changes.
 */
export interface Redirect {
  from: string;
  to: string;
}

export const redirects: Redirect[] = [
  { from: '/mortgage-calculator/', to: '/finance/mortgage-calculator/' },
  { from: '/bmi-calculator/', to: '/health/bmi-calculator/' },
  { from: '/percentage-calculator/', to: '/math/percentage-calculator/' },
  { from: '/tdee-calculator/', to: '/health/calorie-calculator/' },
  { from: '/salary-calculator/', to: '/finance/paycheck-calculator/' },
  { from: '/health/running-pace-calculator/', to: '/sports/running-pace-calculator/' },
];
