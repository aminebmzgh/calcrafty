/** The formula with the user's numbers substituted, step by step. */
import type { MathStep } from '../../lib/types.ts';

export default function ShowTheMath({ steps }: { steps: MathStep[] }) {
  if (!steps.length) return null;
  return (
    <section class="panel" aria-labelledby="math-h">
      <h2 id="math-h" class="text-lg">
        Show the math
      </h2>
      <ol class="math-steps mt-3">
        {steps.map((s, i) => (
          <li key={i} class="math-step">
            <p class="font-semibold">
              {i + 1}. {s.label}
            </p>
            {s.formula && <p class="text-sm muted mt-1">{s.formula}</p>}
            <code>
              {s.substituted}
              {s.result ? ` = ${s.result}` : ''}
            </code>
          </li>
        ))}
      </ol>
    </section>
  );
}
