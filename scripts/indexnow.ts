/**
 * IndexNow: after a deploy, pings participating search engines (Bing, Yandex, Seznam, Naver…)
 * with the URLs whose content changed since the previous deploy, plus URLs that were removed
 * (deleted or turned noindex) so engines re-crawl them and drop them.
 *
 * Usage: tsx scripts/indexnow.ts --previous <path to previous deploy-manifest.json> [--dry-run]
 * The key file lives at the site root (public/<key>.txt), as the protocol requires.
 * Bing's endpoint is used directly: it shares submissions with the other engines, and only direct
 * submissions show up in Bing Webmaster Tools' IndexNow report.
 */
import { readFileSync, readdirSync } from 'node:fs';

const HOST = 'calcrafty.com';
const ENDPOINT = 'https://www.bing.com/indexnow';
const LIVE_WAIT_MS = 15 * 60_000;
const POLL_MS = 20_000;

export function changedUrls(prev: Record<string, string>, next: Record<string, string>): string[] {
  const changed = Object.keys(next).filter((url) => prev[url] !== next[url]);
  const removed = Object.keys(prev).filter((url) => !(url in next));
  return [...changed, ...removed];
}

function findKey(): string {
  const file = readdirSync('public').find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
  if (!file) throw new Error('IndexNow key file (public/<32 hex>.txt) not found');
  return file.replace('.txt', '');
}

/** Waits until Hostinger has pulled the new deploy, so engines don't crawl the old pages (or 404s). */
async function waitForLive(manifest: string): Promise<void> {
  const expected = JSON.stringify(JSON.parse(manifest));
  const deadline = Date.now() + LIVE_WAIT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`https://${HOST}/deploy-manifest.json?t=${Date.now()}`, {
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok && JSON.stringify(await res.json()) === expected) return;
    } catch {
      // Not live yet or a network blip: retry.
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error(`new deploy not live after ${LIVE_WAIT_MS / 60_000} min, not pinging`);
}

async function main() {
  const args = process.argv.slice(2);
  const prevPath = args[args.indexOf('--previous') + 1];
  const dry = args.includes('--dry-run');
  const raw = readFileSync('dist/deploy-manifest.json', 'utf8');
  const next = JSON.parse(raw) as Record<string, string>;
  let prev: Record<string, string> = {};
  try {
    if (prevPath && args.includes('--previous')) prev = JSON.parse(readFileSync(prevPath, 'utf8')) as Record<string, string>;
  } catch {
    prev = {};
  }
  const urls = changedUrls(prev, next).map((p) => `https://${HOST}${p}`);
  if (!urls.length) {
    console.log('[indexnow] no changed URLs');
    return;
  }
  const key = findKey();
  const body = { host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList: urls.slice(0, 10_000) };
  if (dry) {
    console.log(`[indexnow] dry run: would submit ${urls.length} URLs`, urls.slice(0, 10));
    return;
  }
  await waitForLive(raw);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  console.log(`[indexnow] submitted ${urls.length} URLs: HTTP ${res.status}`);
  if (!res.ok) throw new Error(`IndexNow rejected the submission: HTTP ${res.status} ${await res.text()}`);
}

if (process.argv[1]?.endsWith('indexnow.ts')) {
  main().catch((e) => {
    console.error(`[indexnow] ${(e as Error).message}`);
    process.exitCode = 1;
  });
}
