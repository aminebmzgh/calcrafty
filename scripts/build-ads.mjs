// Builds the ads-ON profile into dist-ads/ for Lighthouse CI (cross-platform env var).
import { spawnSync } from 'node:child_process';

const r = spawnSync('npx', ['astro', 'build', '--outDir', 'dist-ads'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ADS_ENABLED: 'true', PUBLIC_ADS_ENABLED: 'true' },
});
process.exit(r.status ?? 1);
