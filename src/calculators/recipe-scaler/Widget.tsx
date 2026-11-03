import Calculator from '../../components/calculator/Calculator.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { RecipeInput, RecipeOutput } from './math.ts';

function Visuals({ input, out }: { input: RecipeInput; out: RecipeOutput }) {
  if (!out.lines.length) return null;
  return (
    <section class="panel" aria-labelledby="recipe-scaled-h">
      <h2 id="recipe-scaled-h" class="text-lg mb-3">
        Ingredients for {num(input.newServings, 2)} servings
      </h2>
      <table class="data-table">
        <caption class="sr-only">Each ingredient, original and scaled</caption>
        <thead>
          <tr>
            <th scope="col">Ingredient</th>
            <th scope="col">Original</th>
            <th scope="col">Scaled</th>
          </tr>
        </thead>
        <tbody>
          {out.lines.map((l, k) => (
            <tr key={k}>
              <th scope="row">{l.rest || l.original}</th>
              <td class="num">{l.quantity === null ? '' : num(l.quantity, 3)}</td>
              <td class="num">
                {l.display === null ? 'unchanged' : `${l.approximate ? '≈ ' : ''}${l.display}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<RecipeInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
