// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { htaccess } from './scripts/integrations/htaccess.ts';

const ANALYTICS_ORIGIN = 'https://cloud.umami.is';

export default defineConfig({
  site: 'https://calcrafty.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  // Instant navigation uses a static Speculation Rules block in BaseLayout (zero JS); see DECISIONS.md.
  prefetch: false,
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        `connect-src 'self' ${ANALYTICS_ORIGIN} https://api-gateway.umami.dev`,
        "img-src 'self' data:",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // Style attributes (charts, SSR markup) cannot be hashed; script-src stays hash-only.
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'"],
      },
      scriptDirective: {
        resources: ["'self'", ANALYTICS_ORIGIN],
      },
    },
  },
  markdown: { syntaxHighlight: false },
  integrations: [preact(), mdx(), htaccess()],
  vite: {
    plugins: [tailwindcss()],
  },
});
