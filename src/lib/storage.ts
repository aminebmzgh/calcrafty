/**
 * Local storage for history (last 10 calculations per site) and favorites.
 * Every function tolerates storage being unavailable (private mode, disabled, quota):
 * the site works fully without it.
 */

const HISTORY_KEY = 'calcrafty:history';
const FAVORITES_KEY = 'calcrafty:favorites';
const RECENT_KEY = 'calcrafty:recent';
export const HISTORY_LIMIT = 10;

export interface HistoryEntry {
  slug: string;
  name: string;
  path: string;
  query: string;
  summary: string;
  at: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: ignore */
  }
}

export function getHistory(): HistoryEntry[] {
  const h = read<HistoryEntry[]>(HISTORY_KEY, []);
  return Array.isArray(h) ? h.slice(0, HISTORY_LIMIT) : [];
}

/** Adds an entry, replacing an identical calculation, newest first, capped at 10. */
export function addHistory(entry: HistoryEntry): HistoryEntry[] {
  const next = [entry, ...getHistory().filter((e) => !(e.slug === entry.slug && e.query === entry.query))].slice(0, HISTORY_LIMIT);
  write(HISTORY_KEY, next);
  return next;
}

export function clearHistory(): void {
  write(HISTORY_KEY, []);
}

export function getFavorites(): string[] {
  const f = read<string[]>(FAVORITES_KEY, []);
  return Array.isArray(f) ? f : [];
}

export function isFavorite(slug: string): boolean {
  return getFavorites().includes(slug);
}

export function toggleFavorite(slug: string): boolean {
  const favs = getFavorites();
  const on = !favs.includes(slug);
  write(FAVORITES_KEY, on ? [slug, ...favs] : favs.filter((s) => s !== slug));
  return on;
}

/** Recently visited calculator slugs (for the homepage). */
export function getRecent(): string[] {
  const r = read<string[]>(RECENT_KEY, []);
  return Array.isArray(r) ? r : [];
}

export function addRecent(slug: string): void {
  write(RECENT_KEY, [slug, ...getRecent().filter((s) => s !== slug)].slice(0, 8));
}
