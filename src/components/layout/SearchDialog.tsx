/**
 * Instant search dialog. Loaded on first use only (from site.ts), so MiniSearch and the
 * index never cost anything on page load.
 */
import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import MiniSearch from 'minisearch';
import { expandQuery, MINISEARCH_OPTIONS, type SearchDoc } from '../../lib/search.ts';

let indexPromise: Promise<{ mini: MiniSearch<SearchDoc>; docs: SearchDoc[] }> | null = null;

function loadIndex() {
  indexPromise ??= fetch('/search-index.json')
    .then((r) => r.json() as Promise<SearchDoc[]>)
    .then((docs) => {
      const mini = new MiniSearch<SearchDoc>(MINISEARCH_OPTIONS);
      mini.addAll(docs);
      return { mini, docs };
    });
  return indexPromise;
}

const KIND_LABEL: Record<SearchDoc['kind'], string> = {
  calculator: 'Calculator',
  guide: 'Guide',
  hub: 'Category',
  state: 'State',
};

function Search({ initial, onClose }: { initial: string; onClose: () => void }) {
  const [q, setQ] = useState(initial);
  const [data, setData] = useState<{ mini: MiniSearch<SearchDoc>; docs: SearchDoc[] } | null>(null);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    d?.showModal();
    d?.addEventListener('close', onClose);
    loadIndex().then(setData, () => setFailed(true));
    return () => d?.removeEventListener('close', onClose);
  }, []);

  const results = useMemo(() => {
    if (!data) return [];
    if (!q.trim()) return data.docs.filter((d) => d.kind === 'calculator').slice(0, 8);
    return data.mini.search(expandQuery(q)).slice(0, 10) as unknown as SearchDoc[];
  }, [q, data]);

  useEffect(() => setActive(0), [q]);

  const go = (url: string) => {
    window.location.href = url;
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Escape') {
      // type=search inputs swallow the first Escape to clear the text; close the dialog instead.
      e.preventDefault();
      dialog.current?.close();
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active].url);
    }
  };

  return (
    <dialog
      ref={dialog}
      class="search-dialog"
      aria-label="Search calculators"
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current?.close();
      }}
    >
      <div class="search-box">
        <div class="input-shell">
          <label for="site-search" class="sr-only">
            Search calculators and guides
          </label>
          <input
            id="site-search"
            type="search"
            role="combobox"
            list={undefined}
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `sr-${active}` : undefined}
            aria-autocomplete="list"
            autocomplete="off"
            placeholder="Try “house payment”, “tdee” or “emi”"
            value={q}
            onInput={(e) => setQ((e.target as HTMLInputElement).value)}
            onKeyDown={onKey}
          />
          <button type="button" class="btn btn-quiet" onClick={() => dialog.current?.close()}>
            Close
          </button>
        </div>
        {failed && <p class="field-error mt-3">Search couldn’t load. Check your connection and try again.</p>}
        <ul id="search-results" role="listbox" aria-label="Results" class="mt-3 grid gap-1">
          {results.map((r, i) => (
            <li key={r.id} id={`sr-${i}`} role="option" aria-selected={i === active}>
              <a href={r.url} class={`search-hit${i === active ? ' is-active' : ''}`} onMouseEnter={() => setActive(i)}>
                <strong>{r.title}</strong>
                <span>
                  {KIND_LABEL[r.kind]} · {r.description}
                </span>
              </a>
            </li>
          ))}
        </ul>
        {data && q.trim() && results.length === 0 && (
          <p class="mt-3 muted">
            No calculator matches “{q}”. Try a broader word such as “loan”, “weight” or “date”.
          </p>
        )}
        <p aria-live="polite" class="sr-only">
          {data ? `${results.length} results` : 'Loading search'}
        </p>
      </div>
    </dialog>
  );
}

let host: HTMLDivElement | null = null;

export function openSearchDialog(initial = '') {
  if (host) return;
  host = document.createElement('div');
  document.body.appendChild(host);
  const opener = document.activeElement as HTMLElement | null;
  const close = () => {
    if (!host) return;
    render(null, host);
    host.remove();
    host = null;
    opener?.focus();
  };
  render(<Search initial={initial} onClose={close} />, host);
}
