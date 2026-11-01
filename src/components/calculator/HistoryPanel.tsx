/** Recent calculations (local storage, last 10 site-wide). Hidden entirely when storage is empty or unavailable. */
import type { HistoryEntry } from '../../lib/storage.ts';

export default function HistoryPanel({ entries, onClear }: { entries: HistoryEntry[]; onClear: () => void }) {
  if (!entries.length) return null;
  return (
    <details class="disclose panel no-print">
      <summary>Your recent calculations ({entries.length})</summary>
      <p class="text-sm muted mt-1">Saved only in this browser.</p>
      <ul class="mt-3 grid gap-2">
        {entries.map((e) => (
          <li key={e.at}>
            <a href={e.path + e.query}>{e.name}</a>: <span class="num">{e.summary}</span>
          </li>
        ))}
      </ul>
      <button type="button" class="btn mt-3" onClick={onClear}>
        Clear history
      </button>
    </details>
  );
}
