/**
 * Real-user monitoring: sends LCP, CLS and INP (with the page path) to the analytics provider
 * as custom events, for a sample of visits. Loaded only when analytics is configured.
 */
const SAMPLE_RATE = 0.2;

type Umami = { track: (event: string, data: Record<string, string | number>) => void };

export function startVitals(): void {
  if (Math.random() >= SAMPLE_RATE) return;
  void import('web-vitals').then(({ onLCP, onCLS, onINP }) => {
    const send = (m: { name: string; value: number; rating: string }) => {
      const umami = (window as unknown as { umami?: Umami }).umami;
      umami?.track('web-vitals', {
        metric: m.name,
        value: m.name === 'CLS' ? Math.round(m.value * 1000) / 1000 : Math.round(m.value),
        rating: m.rating,
        path: location.pathname,
      });
    };
    onLCP(send);
    onCLS(send);
    onINP(send);
  });
}
