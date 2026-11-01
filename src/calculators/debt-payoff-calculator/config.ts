import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, usd } from '../../lib/format.ts';
import { computeDebtPayoff, type DebtInput, type DebtOutput } from './math.ts';

const LABEL = { avalanche: 'Avalanche (highest rate first)', snowball: 'Snowball (smallest balance first)' } as const;

const config: CalculatorConfig<DebtInput, DebtOutput> = {
  slug: 'debt-payoff-calculator',
  category: 'finance',
  subtopic: 'Loans and debt',
  name: 'Debt Payoff Calculator',
  h1: 'Debt Payoff Calculator',
  intro: 'List your debts and compare the snowball and avalanche methods side by side: payoff date, interest and order.',
  metaTitle: 'Debt Payoff Calculator: Snowball vs Avalanche',
  metaDescription:
    'Compare the debt snowball and avalanche methods side by side. Enter your debts and extra payment to see your debt-free date, total interest and payoff order.',
  primaryKeyword: 'debt payoff calculator',
  secondaryKeywords: ['debt snowball calculator', 'debt avalanche calculator', 'debt repayment calculator'],
  synonyms: ['snowball', 'avalanche', 'debt free', 'pay off debt', 'consolidation'],
  inputs: [
    { id: 'debts', label: 'Your debts', type: 'custom' },
    { id: 'extra', label: 'Extra payment each month', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 25, sliderMax: 2_000, helpText: 'On top of all your minimum payments. When a debt is paid off, its minimum rolls over to the next one.' },
  ],
  defaults: {
    debts: [
      { name: 'Store card', balance: 900, apr: 26.99, minPayment: 35 },
      { name: 'Visa', balance: 7_400, apr: 24.49, minPayment: 185 },
      { name: 'Personal loan', balance: 6_000, apr: 11.5, minPayment: 198 },
    ],
    extra: 300,
  },
  validate: (i) => {
    if (i.debts.length === 0) return [{ id: 'debts', message: 'Add at least one debt.' }];
    if (i.debts.some((d) => !(d.balance >= 0) || !(d.apr >= 0) || !(d.minPayment >= 0))) return [{ id: 'debts', message: 'Balances, rates and minimum payments must be zero or more.' }];
    return [];
  },
  compute: computeDebtPayoff,
  summarize: (_i, o) => {
    const b = o[o.best];
    return {
      headline: b.paysOff
        ? { label: 'Debt-free in', value: duration(b.months), sub: `with the ${o.best} method, paying ${usd(o.monthlyBudget)} a month`, raw: b.months, better: 'lower' }
        : { label: 'Debt-free in', value: 'Never', sub: 'Your payments don’t cover the interest. Add an extra payment.' },
      items: [
        { label: 'Total debt', value: usd(o.totalBalance), raw: o.totalBalance },
        { label: 'Avalanche interest', value: o.avalanche.paysOff ? usd(o.avalanche.totalInterest) : '—', raw: o.avalanche.paysOff ? o.avalanche.totalInterest : undefined, better: 'lower' },
        { label: 'Snowball interest', value: o.snowball.paysOff ? usd(o.snowball.totalInterest) : '—', raw: o.snowball.paysOff ? o.snowball.totalInterest : undefined, better: 'lower' },
        { label: 'Minimums only', value: o.minimumsOnly.paysOff ? `${duration(o.minimumsOnly.months)}, ${usd(o.minimumsOnly.totalInterest)} interest` : 'never paid off' },
      ],
    };
  },
  explain: (i, o) => {
    if (!o.avalanche.paysOff) return ['At these payments at least one balance keeps growing. Increase the extra payment until every debt shrinks each month.'];
    const s = [`Paying ${usd(o.monthlyBudget)} a month (your minimums plus ${usd(i.extra)} extra) clears ${usd(o.totalBalance)} of debt in ${duration(o.avalanche.months)} with the avalanche method.`];
    s.push(
      o.avalancheSavings > 0.5
        ? `Avalanche saves ${usd(o.avalancheSavings)} in interest compared with snowball. Snowball clears your first debt (${o.snowball.order[0]?.name ?? ''}) in ${duration(o.snowball.order[0]?.month ?? 0)}, which some people find more motivating.`
        : 'Both methods cost about the same here, so choose the one you’re more likely to stick with.',
    );
    if (o.minimumsOnly.paysOff) s.push(`Paying only the minimums would take ${duration(o.minimumsOnly.months)} and cost ${usd(o.minimumsOnly.totalInterest)} in interest.`);
    return s;
  },
  steps: (i, o) => [
    { label: 'Monthly budget', formula: 'sum of minimum payments + extra', substituted: `${i.debts.map((d) => usd(d.minPayment)).join(' + ')} + ${usd(i.extra)}`, result: usd(o.monthlyBudget) },
    { label: 'Each month', formula: 'add interest (APR ÷ 12) to every balance, pay every minimum, send the rest to the target debt', substituted: 'repeat until every balance is $0' },
    { label: LABEL.avalanche, formula: 'target order: highest APR first', substituted: o.avalanche.order.map((d) => `${d.name} (month ${d.month})`).join(' → '), result: o.avalanche.paysOff ? usd(o.avalanche.totalInterest) : 'never' },
    { label: LABEL.snowball, formula: 'target order: smallest balance first', substituted: o.snowball.order.map((d) => `${d.name} (month ${d.month})`).join(' → '), result: o.snowball.paysOff ? usd(o.snowball.totalInterest) : 'never' },
  ],
  answerSummary: (i, o) =>
    `Paying ${usd(i.extra)} a month on top of the minimums clears ${usd(o.totalBalance)} across ${i.debts.length} debts in ${duration(o.avalanche.months)}; the avalanche method saves ${usd(o.avalancheSavings)} in interest over the snowball.`,
  ogValue: (_i, o) => (o.avalanche.paysOff ? duration(o.avalanche.months) : 'Never'),
  related: ['credit-card-payoff-calculator', 'loan-calculator', 'paycheck-calculator', 'savings-goal-calculator'],
  sources: [
    { title: 'CFPB: Debt and debt collection', url: 'https://www.consumerfinance.gov/consumer-tools/debt-collection/' },
    { title: 'FTC: How to get out of debt', url: 'https://consumer.ftc.gov/articles/how-get-out-debt' },
    { title: 'Federal Reserve G.19 Consumer Credit', url: 'https://www.federalreserve.gov/releases/g19/current/default.htm' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
