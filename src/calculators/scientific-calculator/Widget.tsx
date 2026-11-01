import { useRef } from 'preact/hooks';
import Calculator from '../../components/calculator/Calculator.tsx';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { SciInput } from './math.ts';

/** [label, text inserted, accessible name] */
const KEYS: [string, string, string][] = [
  ['sin', 'sin(', 'sine'],
  ['cos', 'cos(', 'cosine'],
  ['tan', 'tan(', 'tangent'],
  ['(', '(', 'open parenthesis'],
  [')', ')', 'close parenthesis'],
  ['asin', 'asin(', 'inverse sine'],
  ['acos', 'acos(', 'inverse cosine'],
  ['atan', 'atan(', 'inverse tangent'],
  ['xʸ', '^', 'power'],
  ['√', 'sqrt(', 'square root'],
  ['ln', 'ln(', 'natural log'],
  ['log', 'log(', 'log base 10'],
  ['π', 'π', 'pi'],
  ['e', 'e', "Euler's number"],
  ['n!', '!', 'factorial'],
  ['7', '7', '7'],
  ['8', '8', '8'],
  ['9', '9', '9'],
  ['÷', '÷', 'divide'],
  ['%', '%', 'percent'],
  ['4', '4', '4'],
  ['5', '5', '5'],
  ['6', '6', '6'],
  ['×', '×', 'multiply'],
  ['x²', '^2', 'square'],
  ['1', '1', '1'],
  ['2', '2', '2'],
  ['3', '3', '3'],
  ['−', '−', 'minus'],
  ['∛', 'cbrt(', 'cube root'],
  ['0', '0', '0'],
  ['.', '.', 'decimal point'],
  ['EXP', 'e', 'times ten to the power (type e)'],
  ['+', '+', 'plus'],
  ['|x|', 'abs(', 'absolute value'],
];

function Keypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const insert = (text: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + text.length, start + text.length);
    });
  };
  const backspace = () => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const from = start === end ? Math.max(0, start - 1) : start;
    onChange(value.slice(0, from) + value.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(from, from);
    });
  };
  return (
    <div class="field" data-no-search-shortcut>
      <label class="field-label" for="sci-expression">
        Expression
      </label>
      <div class="input-shell">
        <input
          ref={ref}
          id="sci-expression"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellcheck={false}
          class="num"
          style={{ fontSize: '1.25rem' }}
          value={value}
          data-testid="e2e-input"
          data-e2e-value="sqrt(2) × 10"
          aria-describedby="sci-help"
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        />
      </div>
      <p id="sci-help" class="field-help">
        Type with your keyboard (use * for ×, / for ÷, ^ for powers) or tap the keys. The answer updates as you type.
      </p>
      <div class="sci-keys no-print" role="group" aria-label="Calculator keypad">
        {KEYS.map(([label, text, name]) => (
          <button key={label} type="button" class={`btn sci-key${/^\d$|^\.$/.test(label) ? ' sci-digit' : ''}`} aria-label={name === label ? label : `${label} (${name})`} onClick={() => insert(text)}>
            {label}
          </button>
        ))}
        <button type="button" class="btn sci-key" aria-label="Backspace" onClick={backspace}>
          ⌫
        </button>
        <button type="button" class="btn sci-key" aria-label="Clear" onClick={() => onChange('')}>
          C
        </button>
      </div>
    </div>
  );
}

export default function Widget(props: WidgetProps<SciInput>) {
  return <Calculator config={config} {...props} renderCustom={(_def, values, set) => <Keypad value={values.expression} onChange={(v) => set('expression', v)} />} />;
}
