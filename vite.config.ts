import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Strict Content-Security-Policy for production builds only (Vite's dev
 * server injects inline scripts). The app talks to no server at all, so
 * connect-src stays 'self' — an injected script couldn't ship the log anywhere.
 */
const csp: Plugin = {
  name: 'csp',
  apply: 'build',
  transformIndexHtml(html) {
    const policy = [
      "default-src 'self'",
      "script-src 'self'",
      "worker-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
    ].join('; ');
    return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
  },
};

/** Files from public/ the offline shell needs (paths relative to the app's base). */
const PUBLIC_SHELL = ['./', 'manifest.webmanifest', 'icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];

/**
 * Emits dist/sw.js from sw/sw.template.js with the exact list of built
 * files to precache, versioned by a hash of that list.
 */
const serviceWorker: Plugin = {
  name: 'service-worker',
  apply: 'build',
  generateBundle(_, bundle) {
    // Built JS/CSS and woff2 fonts (every current browser takes woff2; the .woff fallbacks aren't needed offline).
    const built = Object.keys(bundle).filter((f) => f.startsWith('assets/') && !f.endsWith('.woff'));
    const precache = [...PUBLIC_SHELL, ...built].sort();
    const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12);
    const source = readFileSync(new URL('./sw/sw.template.js', import.meta.url), 'utf8')
      .replace('__VERSION__', version)
      .replace('__PRECACHE__', JSON.stringify(precache, null, 2));
    this.emitFile({ type: 'asset', fileName: 'sw.js', source });
  },
};

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/; the deploy workflow sets BASE_PATH.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), csp, serviceWorker],
  test: {
    environment: 'node',
  },
});
