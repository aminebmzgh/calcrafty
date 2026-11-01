/**
 * IndexNow: after a deploy, pings participating search engines (Bing, Yandex, Seznam, Naver…)
 * with the indexable URLs whose HTML changed since the previous deploy.
 *
 * Usage: tsx scripts/indexnow.ts --previous <path to previous deploy-manifest.json> [--dry-run]
 * The key file lives at the site root (public/<key>.txt), as the protocol requires.
 */
import { readFileSync, readdirSync } from 'node:fs';

const HOST = 'calcrafty.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

export function changedUrls(prev: Record<string, string>, next: Record<string, string>): string[] {
  return Object.keys(next).filter((url) => prev[url] !== next[url]);
}

function findKey(): string {
  const file = readdirSync('public').find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
  if (!file) throw new Error('IndexNow key file (public/<32 hex>.txt) not found');
  return file.replace('.txt', '');
}

async function main() {
  const args = process.argv.slice(2);
  const prevPath = args[args.indexOf('--previous') + 1];
  const dry = args.includes('--dry-run');
  const next = JSON.parse(readFileSync('dist/deploy-manifest.json', 'utf8')) as Record<string, string>;
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
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  console.log(`[indexnow] submitted ${urls.length} URLs: HTTP ${res.status}`);
}

if (process.argv[1]?.endsWith('indexnow.ts')) {
  main().catch((e) => {
    console.warn(`[indexnow] ${(e as Error).message}`);
  });
}
