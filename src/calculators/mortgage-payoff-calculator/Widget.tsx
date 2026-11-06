import Calculator from '../../components/calculator/Calculator.tsx';
import AmortizationTable from '../../components/calculator/AmortizationTable.tsx';
import { duration, usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { PayoffInput, PayoffOutput } from './math.ts';

function Visuals({ input, out }: { input: PayoffInput; out: PayoffOutput }) {
  if (!out.base.paysOff) return null;
  return (
    <div class="grid gap-6">
      <section class="panel" aria-labelledby="payoff-extra-h">
        <h2 id="payoff-extra-h" class="text-lg mb-3">
          What different extra payments do
        </h2>
        <table class="data-table">
          <caption class="sr-only">Payoff time and interest for each extra monthly payment, from your current balance</caption>
          <thead>
            <tr>
              <th scope="col">Extra a month</th>
              <th scope="col">Paid off in</th>
              <th scope="col">Interest</th>
              <th scope="col">Saved</th>
            </tr>
          </thead>
          <tbody>
            {out.scenarios.map((s) => (
              <tr key={s.extra}>
                <th scope="row">{s.extra === 0 ? 'None' : usd(s.extra)}</th>
                <td>{duration(s.months)}</td>
                <td class="num">{usd(s.totalInterest)}</td>
                <td class="num">{usd(s.interestSaved)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p class="text-sm muted mt-2">From a {usd(input.balance)} balance at your {usd(input.payment)} payment, without the lump sum.</p>
      </section>
      <AmortizationTable rows={out.actual.rows} years={out.years} name="mortgage-payoff" />
    </div>
  );
}

export default function Widget(props: WidgetProps<PayoffInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
