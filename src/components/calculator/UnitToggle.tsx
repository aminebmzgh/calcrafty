/** Segmented radio group used for unit toggles ($/%, lbs/kg, monthly/yearly). Arrow keys move between options natively. */
export interface UnitToggleProps {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

export default function UnitToggle({ name, label, value, options, onChange }: UnitToggleProps) {
  return (
    <div class="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label key={o.value}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}
