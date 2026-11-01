/** Collapsible data table with CSV export. Large tables start collapsed. */
import type { ComponentChildren } from 'preact';

export interface Column<R> {
  key: string;
  label: string;
  value: (row: R) => string;
  /** Raw value for CSV (defaults to the display value). */
  csv?: (row: R) => string | number;
}

export function toCsv<R>(columns: Column<R>[], rows: R[]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.map((c) => esc(c.label)).join(','), ...rows.map((r) => columns.map((c) => esc(c.csv ? c.csv(r) : c.value(r))).join(','))].join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DataTable<R>({
  title,
  caption,
  columns,
  rows,
  csvName,
  controls,
  open = false,
}: {
  title: string;
  caption: string;
  columns: Column<R>[];
  rows: R[];
  csvName: string;
  controls?: ComponentChildren;
  open?: boolean;
}) {
  return (
    <details class="disclose panel" open={open}>
      <summary>{title}</summary>
      <div class="mt-3 flex flex-wrap items-center gap-3 no-print">
        {controls}
        <button type="button" class="btn" onClick={() => downloadCsv(csvName, toCsv(columns, rows))}>
          Download CSV
        </button>
      </div>
      <div class="table-scroll mt-3" tabIndex={0} role="region" aria-label={caption}>
        <table class="data-table">
          <caption class="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map((c, j) =>
                  j === 0 ? (
                    <th key={c.key} scope="row" style={{ fontWeight: 500 }}>
                      {c.value(r)}
                    </th>
                  ) : (
                    <td key={c.key}>{c.value(r)}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
