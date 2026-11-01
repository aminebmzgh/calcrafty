import { useEffect, useRef, useState } from 'preact/hooks';
import Calculator from '../../components/calculator/Calculator.tsx';
import { formatInputValue, parseFriendly } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import { GRADE_POINTS, LEVELS, type Course, type GpaInput } from './math.ts';

const MAX = 15;

function Credits({ id, value, onValue }: { id: string; value: number; onValue: (n: number) => void }) {
  const [text, setText] = useState(() => formatInputValue(value, 'none', 0.5));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(formatInputValue(value, 'none', 0.5));
  }, [value]);
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onFocus={() => (focused.current = true)}
      onBlur={() => {
        focused.current = false;
        setText(formatInputValue(value, 'none', 0.5));
      }}
      onInput={(e) => {
        const raw = (e.target as HTMLInputElement).value;
        setText(raw);
        const n = parseFriendly(raw);
        if (n !== null && n >= 0 && n <= 30) onValue(n);
      }}
    />
  );
}

function CourseList({ courses, onChange }: { courses: Course[]; onChange: (c: Course[]) => void }) {
  const update = (i: number, patch: Partial<Course>) => onChange(courses.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <fieldset class="field" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend class="field-label">Courses</legend>
      <div class="grid gap-3">
        {courses.map((c, i) => (
          <div key={i} class="panel grid gap-2" style={{ padding: '.75rem' }}>
            <div class="flex items-center gap-2">
              <label class="sr-only" for={`course-${i}-name`}>
                Course {i + 1} name
              </label>
              <div class="input-shell flex-1">
                <input id={`course-${i}-name`} type="text" value={c.name} maxLength={40} onInput={(e) => update(i, { name: (e.target as HTMLInputElement).value || `Course ${i + 1}` })} />
              </div>
              <button type="button" class="btn btn-quiet" aria-label={`Remove ${c.name}`} disabled={courses.length <= 1} onClick={() => onChange(courses.filter((_, j) => j !== i))}>
                Remove
              </button>
            </div>
            <div class="field-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(6.5rem, 1fr))' }}>
              <div class="field">
                <label class="field-help" for={`course-${i}-credits`}>
                  Credits<span class="sr-only"> for {c.name}</span>
                </label>
                <div class="input-shell">
                  <Credits id={`course-${i}-credits`} value={c.credits} onValue={(n) => update(i, { credits: n })} />
                </div>
              </div>
              <div class="field">
                <label class="field-help" for={`course-${i}-grade`}>
                  Grade<span class="sr-only"> for {c.name}</span>
                </label>
                <div class="input-shell">
                  <select id={`course-${i}-grade`} value={c.grade} onChange={(e) => update(i, { grade: (e.target as HTMLSelectElement).value as Course['grade'] })}>
                    {Object.entries(GRADE_POINTS).map(([g, p]) => (
                      <option key={g} value={g}>
                        {g} ({p.toFixed(1)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div class="field">
                <label class="field-help" for={`course-${i}-level`}>
                  Level<span class="sr-only"> for {c.name}</span>
                </label>
                <div class="input-shell">
                  <select id={`course-${i}-level`} value={c.level} onChange={(e) => update(i, { level: (e.target as HTMLSelectElement).value as Course['level'] })}>
                    {Object.entries(LEVELS).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" class="btn mt-3" disabled={courses.length >= MAX} onClick={() => onChange([...courses, { name: `Course ${courses.length + 1}`, grade: 'A', credits: 3, level: 'regular' }])}>
        Add a course
      </button>
    </fieldset>
  );
}

export default function Widget(props: WidgetProps<GpaInput>) {
  return <Calculator config={config} {...props} renderCustom={(_def, values, set) => <CourseList courses={values.courses} onChange={(c) => set('courses', c)} />} />;
}
