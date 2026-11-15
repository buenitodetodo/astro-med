import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  devToolbar: { enabled: false },
  build: { format: 'file' },
  integrations: [react()],
  markdown: { syntaxHighlight: false },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
    server: { proxy: { '/v1': process.env.API_URL ?? 'http://localhost:8787' } },
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "connect-src 'self'",
        "img-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { resources: ["'self'"] },
    },
  },
});
