import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve(process.cwd(), 'dist');
const MANIFEST_PATH = resolve(DIST, '.vite', 'manifest.json');
const SERVICE_WORKER_PATH = resolve(DIST, 'sw.js');

const BUDGETS = Object.freeze({
  initialJavaScript: 2 * 1024 * 1024,
  initialCss: 1024 * 1024,
  largestJavaScriptChunk: 1536 * 1024,
  precache: 512 * 1024,
});

const fail = (message) => {
  throw new Error(`Budget de performance non respecté: ${message}`);
};

if (!existsSync(MANIFEST_PATH) || !existsSync(SERVICE_WORKER_PATH)) {
  fail('exécuter le build de production avant ce contrôle.');
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const entries = Object.entries(manifest).filter(([, value]) => value.isEntry);
if (entries.length !== 1) {
  fail(`une entrée Vite attendue, ${entries.length} détectée(s).`);
}

const initialFiles = new Set();
const initialCss = new Set();
const visited = new Set();
const visit = (key) => {
  if (visited.has(key)) return;
  const chunk = manifest[key];
  if (!chunk) fail(`import absent du manifeste: ${key}`);
  visited.add(key);
  if (chunk.file?.endsWith('.js')) initialFiles.add(chunk.file);
  for (const cssFile of chunk.css ?? []) initialCss.add(cssFile);
  for (const importedKey of chunk.imports ?? []) visit(importedKey);
};
visit(entries[0][0]);

const bytes = (relativePath) => statSync(resolve(DIST, relativePath)).size;
const initialJavaScriptBytes = [...initialFiles].reduce((sum, file) => sum + bytes(file), 0);
const initialCssBytes = [...initialCss].reduce((sum, file) => sum + bytes(file), 0);

const javascriptChunks = Object.values(manifest)
  .map((value) => value.file)
  .filter((file, index, values) => file?.endsWith('.js') && values.indexOf(file) === index);
const largestChunkBytes = Math.max(...javascriptChunks.map(bytes));

const serviceWorker = readFileSync(SERVICE_WORKER_PATH, 'utf8');
const precacheFiles = [...serviceWorker.matchAll(/url:"([^"]+)"/g)]
  .map((match) => match[1])
  .filter((file) => existsSync(resolve(DIST, file)));
const precacheBytes = precacheFiles.reduce((sum, file) => sum + bytes(file), 0);

const measurements = {
  initialJavaScriptBytes,
  initialCssBytes,
  largestChunkBytes,
  precacheBytes,
  initialJavaScriptFiles: initialFiles.size,
  initialCssFiles: initialCss.size,
  precacheFiles: precacheFiles.length,
};

for (const [metric, budget] of Object.entries(BUDGETS)) {
  const measured = {
    initialJavaScript: initialJavaScriptBytes,
    initialCss: initialCssBytes,
    largestJavaScriptChunk: largestChunkBytes,
    precache: precacheBytes,
  }[metric];
  if (measured > budget) fail(`${metric} = ${measured} octets, budget = ${budget} octets.`);
}

console.log(`Budgets terrain respectés: ${JSON.stringify(measurements)}.`);
