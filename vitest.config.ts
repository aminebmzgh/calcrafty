import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
    // The registry discovers calculators with import.meta.glob; the on-disk transform cache
    // doesn't notice new folders, so a cached registry would silently skip new calculators.
    fsModuleCache: false,
  },
});
