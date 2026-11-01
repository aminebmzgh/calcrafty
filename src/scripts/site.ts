/**
 * Site-wide client script (loaded on every page, kept tiny):
 * theme toggle, search shortcut (/ or Ctrl/Cmd+K) and the lazily loaded search dialog.
 */
const THEME_KEY = 'calcrafty:theme';
const root = document.documentElement;

function currentTheme(): 'light' | 'dark' {
  return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function syncToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* storage unavailable */
  }
  syncToggle();
});

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch {
    /* storage unavailable */
  }
  if (!stored) {
    root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    syncToggle();
  }
});
syncToggle();

// ---- Search ----
let searchModule: Promise<typeof import('../components/layout/SearchDialog.tsx')> | null = null;

function openSearch(initial = '') {
  searchModule ??= import('../components/layout/SearchDialog.tsx');
  void searchModule.then((m) => m.openSearchDialog(initial));
}

document.getElementById('search-open')?.addEventListener('click', (e) => {
  if (e instanceof MouseEvent && (e.metaKey || e.ctrlKey || e.shiftKey)) return;
  e.preventDefault();
  openSearch();
});

document.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement | null;
  const typing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
  if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey)) {
    if (target?.closest('[data-no-search-shortcut]')) return;
    e.preventDefault();
    openSearch();
  }
});
