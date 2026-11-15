import { appendFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

/** Writes the list of built files so the service worker can precache the whole app. */
const precache = {
  name: 'astro-med-precache',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const root = fileURLToPath(dir);
      const skip = /(^\/(sw\.js|_headers|precache\.json)$)|\.map$|\.md$/;
      const urls = (await readdir(root, { recursive: true, withFileTypes: true }))
        .filter((f) => f.isFile())
        .map((f) => '/' + path.relative(root, path.join(f.parentPath, f.name)).split(path.sep).join('/'))
        .filter((u) => !skip.test(u))
        .map((u) => (u === '/index.html' ? '/' : u.replace(/\.html$/, '')));
      await writeFile(path.join(root, 'precache.json'), JSON.stringify({ urls }));
      // A changed byte in sw.js makes browsers install the new worker and refresh the precache.
      await appendFile(path.join(root, 'sw.js'), `\n// build ${Date.now()}\n`);
    },
  },
};

export default defineConfig({
  output: 'static',
  devToolbar: { enabled: false }, // keep the console clean when demoing from the dev server
  build: { format: 'file' },
  integrations: [react(), precache],
  markdown: { syntaxHighlight: false }, // no markdown pages; avoids a CSP warning from the default highlighter
  // Same-origin API in dev: /v1 is proxied to the Hono Worker (wrangler dev on :8787).
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
        "img-src 'self' data: blob:",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { resources: ["'self'"] },
    },
  },
});
