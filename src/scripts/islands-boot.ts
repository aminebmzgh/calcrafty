/**
 * Tiny, dependency-free bootstrap for calculator widgets.
 *
 * The server HTML already shows the complete default result, so no widget code is fetched
 * during page load. Hydration starts on the first interaction with a widget (focus, pointer,
 * key, click), immediately for share links (inputs in the query string), and otherwise the
 * code is preloaded shortly after load so the first interaction is instant.
 */
const TRIGGERS = ['focusin', 'pointerdown', 'keydown', 'touchstart', 'click'] as const;
const roots = [...document.querySelectorAll<HTMLElement>('[data-widget]')];
let started = false;
let pending: HTMLElement | null = null;

const load = () => import('./islands.ts');

function begin() {
  if (started) return;
  started = true;
  void load().then((m) =>
    m.start(pending).then(() => {
      for (const r of roots) for (const t of TRIGGERS) r.removeEventListener(t, onTrigger, true);
    }),
  );
}

function onTrigger(e: Event) {
  // A button click before the widget is live would do nothing: hold it and replay after hydration.
  if (e.type === 'click') {
    const btn = (e.target as HTMLElement).closest('button');
    if (btn && !btn.closest('.calc[data-hydrated="true"]')) {
      e.preventDefault();
      e.stopPropagation();
      pending = btn;
    }
  }
  begin();
}

if (roots.length) {
  for (const r of roots) for (const t of TRIGGERS) r.addEventListener(t, onTrigger, { capture: true, passive: t !== 'click' });
  if (location.search.length > 1) begin();
  else {
    const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 500));
    const later = () => setTimeout(() => idle(() => void load().then((m) => m.preload())), 2000);
    if (document.readyState === 'complete') later();
    else addEventListener('load', later, { once: true });
  }
}
