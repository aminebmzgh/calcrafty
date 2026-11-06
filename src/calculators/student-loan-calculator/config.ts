import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, num, pct, usd } from '../../lib/format.ts';
import { computeStudentLoan, EXTENDED_MIN_BALANCE, type Plan, type PlanResult, type StudentLoanInput, type StudentLoanOutput } from './math.ts';

export const PLAN_NAMES: Record<Plan, string> = {
  standard: 'Standard (10 years)',
  graduated: 'Graduated (10 years)',
  extended: 'Extended (25 years)',
  tiered: 'Tiered Standard (new loans)',
};

export const PLAN_NOTES: Record<Plan, string> = {
  standard: 'Loans first disbursed before July 1, 2026',
  graduated: 'Loans before July 1, 2026; estimate',
  extended: `Loans before July 1, 2026; over ${usd(EXTENDED_MIN_BALANCE)} in Direct Loans`,
  tiered: 'Loans first disbursed on or after July 1, 2026',
};

export const paymentLabel = (p: PlanResult): string =>
  p.plan === 'graduated' && p.rows.length > 24 ? `${usd(p.firstPayment, true)} → ${usd(p.rows[p.rows.length - 2]?.payment ?? p.lastPayment, true)}` : usd(p.firstPayment, true);

const config: CalculatorConfig<StudentLoanInput, StudentLoanOutput> = {
  slug: 'student-loan-calculator',
  category: 'finance',
  subtopic: 'Loans and debt',
  name: 'Student Loan Calculator',
  h1: 'Student Loan Calculator',
  intro: 'Monthly payments and total interest on federal student loans under the Standard, Graduated, Extended and new Tiered Standard plans.',
  metaTitle: 'Student Loan Calculator: Payments by Repayment Plan',
  metaDescription:
    'Free student loan calculator: payments and total interest under the Standard, Graduated, Extended and 2026 Tiered Standard plans, plus extra-payment savings.',
  primaryKeyword: 'student loan calculator',
  secondaryKeywords: ['student loan payment calculator', 'student loan repayment calculator', 'federal student loan calculator', 'student loan payoff calculator'],
  synonyms: ['college loan', 'direct loan', 'tiered standard', 'graduated repayment', 'extended repayment', 'fafsa loan'],
  inputs: [
    { id: 'balance', label: 'Loan balance', type: 'number', unit: 'usd', min: 0, max: 2_000_000, step: 500, sliderMax: 200_000, helpText: 'Total federal Direct Loans when repayment starts, including any interest added.' },
    { id: 'interestRate', label: 'Interest rate', type: 'number', unit: 'percent', min: 0, max: 20, step: 0.01, sliderMax: 12, helpText: '2026–27 federal rates: 6.52% undergraduate, 8.07% graduate, 9.07% PLUS. Use your weighted average for several loans.' },
    { id: 'plan', label: 'Repayment plan', type: 'select', options: (['standard', 'graduated', 'extended', 'tiered'] as Plan[]).map((p) => ({ value: p, label: PLAN_NAMES[p] })) },
    { id: 'extraMonthly', label: 'Extra each month', type: 'number', unit: 'usd', min: 0, max: 100_000, step: 10, sliderMax: 1_000, advanced: true, helpText: 'Federal loans have no prepayment penalty. Ask your servicer to apply extra to principal.' },
  ],
  defaults: { balance: 35_000, interestRate: 6.52, plan: 'standard', extraMonthly: 0 },
  compute: computeStudentLoan,
  summarize: (_i, o) => ({
    headline: { label: 'Monthly payment', value: paymentLabel(o.selected), sub: `${PLAN_NAMES[o.selected.plan]}, paid off in ${duration(o.selected.months)}`, raw: o.selected.firstPayment, better: 'lower' },
    items: [
      { label: 'Total interest', value: usd(o.selected.totalInterest, true), raw: o.selected.totalInterest, better: 'lower' },
      { label: 'Total of payments', value: usd(o.selected.totalPaid, true), raw: o.selected.totalPaid, better: 'lower' },
      { label: 'First month’s interest', value: usd(o.firstInterest, true), raw: o.firstInterest },
      { label: 'Interest saved by extra', value: usd(o.interestSaved, true), raw: o.interestSaved, better: 'higher' },
    ],
  }),
  explain: (i, o) => {
    if (i.balance <= 0) return ['Enter your loan balance to compare plans.'];
    const std = o.plans.find((p) => p.plan === 'standard')!;
    const s: string[] = [];
    if (i.plan === 'standard') s.push(`On the 10-year Standard plan you pay ${usd(std.firstPayment, true)} a month and ${usd(std.totalInterest)} in interest. It’s the fastest and cheapest of the fixed plans.`);
    else {
      s.push(`${PLAN_NAMES[i.plan]} costs ${usd(o.costVsStandard)} more interest than the 10-year Standard plan (${usd(std.firstPayment, true)} a month), in exchange for ${i.plan === 'graduated' ? 'lower payments in the first years' : 'a lower monthly payment'}.`);
    }
    if (i.plan === 'graduated') s.push(`Payments start at ${usd(o.selected.firstPayment, true)} and rise every two years. Servicers set the exact amounts; this estimate follows the federal rules (no payment below the interest, none more than three times another).`);
    if (i.plan === 'extended' && !o.selected.eligible) s.push(`Extended repayment needs more than ${usd(EXTENDED_MIN_BALANCE)} in Direct Loans, so this balance doesn’t qualify; the figures show what it would cost.`);
    if (i.plan === 'tiered') s.push(`For loans first disbursed on or after July 1, 2026, the Tiered Standard term depends on the balance: ${o.tieredYears} years for ${usd(i.balance)}. The other choice for new loans is the income-based Repayment Assistance Plan (RAP), which this calculator doesn’t model.`);
    if (o.monthsSaved > 0) s.push(`Paying ${usd(i.extraMonthly)} extra a month finishes ${duration(o.monthsSaved)} early and saves ${usd(o.interestSaved)}.`);
    return s;
  },
  steps: (i, o) => {
    const r = o.rate;
    const n = o.scheduled.months;
    const s = [
      { label: 'Monthly interest rate', formula: 'r = annual rate ÷ 12', substituted: `r = ${pct(i.interestRate, 3)} ÷ 12`, result: num(r, 6) },
      { label: 'Number of payments', formula: i.plan === 'tiered' ? 'n = tier term × 12 (by balance)' : 'n = plan term × 12', substituted: `n = ${num(o.scheduled.months / 12, 0)} × 12`, result: String(n) },
    ];
    if (i.plan === 'graduated')
      s.push(
        { label: 'Step size', formula: 'payments × g every 24 months; g⁴ ≤ 3 so no payment is more than 3× another', substituted: `g = ${num(o.graduatedStep, 4)}`, result: `×${num(o.graduatedStep, 4)} every 2 years` },
        { label: 'First payment', formula: 'P₁ such that five 24-month steps repay the balance (at least the monthly interest)', substituted: `${usd(i.balance)} at ${pct(i.interestRate)}`, result: usd(o.scheduled.firstPayment, true) },
      );
    else
      s.push({
        label: 'Monthly payment',
        formula: r === 0 ? 'M = P ÷ n' : 'M = P × r(1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)',
        substituted: r === 0 ? `M = ${usd(i.balance)} ÷ ${n}` : `M = ${usd(i.balance)} × ${num(r, 6)}(1 + ${num(r, 6)})^${n} ÷ ((1 + ${num(r, 6)})^${n} − 1)`,
        result: usd(o.scheduled.firstPayment, true),
      });
    s.push({ label: 'Total interest', formula: 'sum of each month’s interest (balance × r)', substituted: `${o.selected.months} payments`, result: usd(o.selected.totalInterest, true) });
    return s;
  },
  answerSummary: (i, o) => `A ${usd(i.balance)} federal student loan at ${pct(i.interestRate)} costs ${usd(o.plans[0]!.firstPayment, true)} a month on the 10-year Standard plan, with ${usd(o.plans[0]!.totalInterest)} in total interest.`,
  ogValue: (_i, o) => `${usd(o.selected.firstPayment)}/mo`,
  related: ['loan-calculator', 'debt-payoff-calculator', 'debt-to-income-ratio-calculator', 'salary-to-hourly-calculator', 'paycheck-calculator', 'amortization-calculator'],
  sources: [
    { title: 'Federal Student Aid: Repayment plans', url: 'https://studentaid.gov/manage-loans/repayment/plans' },
    { title: 'Federal Student Aid: Interest rates and fees for federal student loans', url: 'https://studentaid.gov/understand-aid/types/loans/interest-rates' },
    { title: 'Congressional Research Service: Direct Loan Program: Student Loan Repayment Plans (IF13243)', url: 'https://www.congress.gov/crs-product/IF13243' },
    { title: 'eCFR: 34 CFR 685.208, repayment plans', url: 'https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-685/subpart-B/section-685.208' },
  ],
  lastReviewed: '2026-11-06',
};

export default config;
