/** Result toolbar: share link, copy result, compare, favorite, print, reset. Status is announced politely. */
import { useState } from 'preact/hooks';

export interface ShareToolbarProps {
  shareUrl: () => string;
  resultText: () => string;
  title: string;
  onReset: () => void;
  onCompare?: () => void;
  compareFull?: boolean;
  favorite?: boolean;
  onFavorite?: () => void;
  embed?: boolean;
  canonicalUrl: string;
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function ShareButton(p: ShareToolbarProps) {
  const [status, setStatus] = useState('');
  const say = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 2500);
  };

  if (p.embed) {
    return (
      <div class="toolbar">
        <a class="btn" href={p.shareUrl()} target="_blank" rel="noopener">
          Open on Calcrafty
        </a>
      </div>
    );
  }

  return (
    <div class="no-print">
      <div class="toolbar" role="group" aria-label="Result actions">
        <button
          type="button"
          class="btn btn-primary"
          onClick={async () => {
            const url = p.shareUrl();
            if (navigator.share && matchMedia('(pointer: coarse)').matches) {
              try {
                await navigator.share({ title: p.title, url });
                return;
              } catch {
                /* cancelled: fall back to copy */
              }
            }
            say((await copy(url)) ? 'Link copied. It opens this calculator with your numbers.' : `Copy this link: ${url}`);
          }}
        >
          Copy link
        </button>
        <button type="button" class="btn" onClick={async () => say((await copy(p.resultText())) ? 'Result copied.' : 'Copying is blocked in this browser.')}>
          Copy result
        </button>
        {p.onCompare && (
          <button type="button" class="btn" disabled={p.compareFull} onClick={p.onCompare} title={p.compareFull ? 'Remove a scenario to add another (max 3)' : undefined}>
            {p.compareFull ? 'Compare full (3)' : 'Add to compare'}
          </button>
        )}
        {p.onFavorite && (
          <button type="button" class="btn" aria-pressed={p.favorite ? 'true' : 'false'} onClick={p.onFavorite}>
            {p.favorite ? '★ Favorite' : '☆ Favorite'}
          </button>
        )}
        <button type="button" class="btn btn-quiet" onClick={() => window.print()}>
          Print
        </button>
        <button type="button" class="btn btn-quiet" onClick={() => (p.onReset(), say('Reset to the default values.'))}>
          Reset
        </button>
      </div>
      <p class="mt-2 text-sm" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
