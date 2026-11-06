import Calculator from '../../components/calculator/Calculator.tsx';
import AmortizationTable from '../../components/calculator/AmortizationTable.tsx';
import { duration, usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config, { PLAN_NAMES, PLAN_NOTES, paymentLabel } from './config.ts';
import type { StudentLoanInput, StudentLoanOutput } from './math.ts';

function Visuals({ input, out }: { input: StudentLoanInput; out: StudentLoanOutput }) {
  if (input.balance <= 0) return null;
  return (
    <div class="grid gap-6">
      <section class="panel" aria-labelledby="student-plans-h">
        <h2 id="student-plans-h" class="text-lg mb-3">
          Every plan for {usd(input.balance)} at {input.interestRate}%
        </h2>
        <table class="data-table">
          <caption class="sr-only">Monthly payment, term and total interest under each fixed-payment plan</caption>
          <thead>
            <tr>
              <th scope="col">Plan</th>
              <th scope="col">Monthly payment</th>
              <th scope="col">Term</th>
              <th scope="col">Total interest</th>
              <th scope="col">Who can use it</th>
            </tr>
          </thead>
          <tbody>
            {out.plans.map((p) => (
              <tr key={p.plan} aria-current={p.plan === input.plan ? 'true' : undefined}>
                <th scope="row">{PLAN_NAMES[p.plan]}</th>
                <td class="num">{paymentLabel(p)}</td>
                <td>{duration(p.months)}</td>
                <td class="num">{usd(p.totalInterest)}</td>
                <td class="text-sm">{p.eligible ? PLAN_NOTES[p.plan] : `Not available: ${PLAN_NOTES[p.plan]}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p class="text-sm muted mt-2">Income-based plans (RAP and the older IBR) set payments from your income instead; see the guide below the calculator.</p>
      </section>
      <AmortizationTable rows={out.selected.rows} years={out.years} name="student-loan" />
    </div>
  );
}

export default function Widget(props: WidgetProps<StudentLoanInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
