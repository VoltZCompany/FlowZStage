#!/usr/bin/env node
// Stamps BUILD_ID into dist/sw.js, dist/version.json and dist/index.html
// after `expo export --platform web` so every deploy:
// - produces a byte-different service worker
// - exposes /version.json that clients can poll to detect updates
//   independent of the Service Worker lifecycle (important on iOS PWA)
// - injects an inline bootstrap that runs BEFORE the main bundle and
//   force-reloads with a fresh buildId, so PWAs stuck on old cached
//   JS still recover without user intervention.
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distSw = join(root, 'dist', 'sw.js');
const publicSw = join(root, 'public', 'sw.js');
const distVersion = join(root, 'dist', 'version.json');
const publicVersion = join(root, 'public', 'version.json');
const distHtml = join(root, 'dist', 'index.html');

if (!existsSync(distSw)) {
  if (!existsSync(publicSw)) {
    console.error('stamp-sw: neither dist/sw.js nor public/sw.js exists');
    process.exit(1);
  }
  copyFileSync(publicSw, distSw);
}

if (!existsSync(distVersion) && existsSync(publicVersion)) {
  copyFileSync(publicVersion, distVersion);
}

const buildId = `${Date.now()}`;

const swSrc = readFileSync(distSw, 'utf8');
writeFileSync(distSw, swSrc.replace(/__BUILD_ID__/g, buildId));

if (existsSync(distVersion)) {
  const versionSrc = readFileSync(distVersion, 'utf8');
  writeFileSync(distVersion, versionSrc.replace(/__BUILD_ID__/g, buildId));
} else {
  writeFileSync(distVersion, JSON.stringify({ buildId }) + '\n');
}

if (existsSync(distHtml)) {
  let html = readFileSync(distHtml, 'utf8');

  // Fix viewport: prevent pinch-zoom and auto-zoom on input focus (iOS Safari
  // zooms when focused input font-size < 16px), and keep safe-area coverage.
  html = html.replace(
    /<meta name="viewport"[^>]*>/,
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />',
  );

  // Bootstrap guard: uses _v URL param (not sessionStorage) to detect a completed update.
  // Removed the lastTried sessionStorage guard — it permanently blocked retries when the
  // first reload attempt failed (e.g. old SW still served stale HTML from cache).
  const bootstrap = `<script>(function(){try{var BID='${buildId}';if(new URL(location.href).searchParams.get('_v')===BID)return;fetch('/version.json?ts='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(j){var s=j&&typeof j.buildId==='string'?j.buildId:null;if(!s||s==='__BUILD_ID__'||s===BID)return;var p=Promise.resolve();if('caches' in window){p=caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k);}));}).catch(function(){});}p.then(function(){if('serviceWorker' in navigator){return navigator.serviceWorker.getRegistrations().then(function(rs){return Promise.all(rs.map(function(r){return r.unregister();}));}).catch(function(){});}}).then(function(){var u=new URL(location.href);u.searchParams.set('_v',s);location.replace(u.toString());});}).catch(function(){});}catch(e){}})();</script>`;
  const stripped = html.replace(/\s*<script>\(function\(\)\{try\{var BID='\d+';[\s\S]*?<\/script>\s*/g, '');
  const injected = stripped.replace('</head>', `  ${bootstrap}\n</head>`);
  writeFileSync(distHtml, injected);
}

console.log(`stamp-sw: BUILD_ID=${buildId}`);
