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
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  experimental: {
    clientPrerender: true,
  },
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
      scriptDirective: {
        resources: ["'self'", ANALYTICS_ORIGIN],
      },
    },
  },
  integrations: [preact(), mdx(), htaccess()],
  vite: {
    plugins: [tailwindcss()],
  },
});
