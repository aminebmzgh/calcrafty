import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default defineConfig(
  { ignores: ['dist/', 'dist-ads/', '.astro/', '.tmp/', 'node_modules/', 'playwright-report/', 'test-results/', '.lighthouseci/'] },
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/lib/registry*'],
              message: 'Client code must not import the registry (it bundles every calculator). Pass data as props.',
              importNamePattern: '.*',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { require: 'readonly', module: 'writable' } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // The registry may be imported from server-only code: pages, layouts, libs and scripts.
    files: ['src/pages/**', 'src/layouts/**', 'src/lib/**', 'scripts/**', 'src/components/**/*.astro', 'tests/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
