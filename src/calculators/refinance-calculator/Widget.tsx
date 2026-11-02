import Calculator from '../../components/calculator/Calculator.tsx';
import { duration, usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { RefiInput, RefiOutput } from './math.ts';

function Visuals({ input, out }: { input: RefiInput; out: RefiOutput }) {
  return (
    <section class="panel" aria-labelledby="refi-compare-h">
      <h2 id="refi-compare-h" class="text-lg mb-3">
        Current loan vs refinance
      </h2>
      <table class="data-table">
        <caption class="sr-only">Comparison of the current loan and the refinance</caption>
        <thead>
          <tr>
            <th scope="col">Detail</th>
            <th scope="col">Current loan</th>
            <th scope="col">Refinance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Balance</th>
            <td class="num">{usd(input.balance)}</td>
            <td class="num">{usd(out.newLoan)}</td>
          </tr>
          <tr>
            <th scope="row">Monthly payment (P&amp;I)</th>
            <td class="num">{usd(out.currentPayment, true)}</td>
            <td class="num">{usd(out.newPayment, true)}</td>
          </tr>
          <tr>
            <th scope="row">Time left</th>
            <td class="num">{duration(out.currentMonths)}</td>
            <td class="num">{duration(out.newMonths)}</td>
          </tr>
          <tr>
            <th scope="row">Interest still to pay</th>
            <td class="num">{usd(out.currentInterest, true)}</td>
            <td class="num">{usd(out.newInterest, true)}</td>
          </tr>
          <tr>
            <th scope="row">Closing costs</th>
            <td class="num">{usd(0)}</td>
            <td class="num">{usd(input.closingCosts)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<RefiInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
