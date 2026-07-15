/**
 * Fails the production build if any emitted JS chunk still contains a bare
 * npm package import (e.g. `from"fuse.js"`). That pattern breaks the browser
 * because spa/Nginx serves index.html for unknown paths instead of the module.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const assetsDir = join(process.cwd(), 'dist', 'assets');

const BARE_IMPORT_RE =
  /\bfrom\s*["']([a-zA-Z0-9@][^"']*)["']|\bimport\s*\(\s*["']([a-zA-Z0-9@][^"']*)["']\s*\)/g;

const isRelativeOrAbsolute = (specifier) =>
  specifier.startsWith('./') ||
  specifier.startsWith('../') ||
  specifier.startsWith('/') ||
  specifier.startsWith('http://') ||
  specifier.startsWith('https://') ||
  specifier.startsWith('data:');

const walkJsFiles = (dir) => {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      files.push(...walkJsFiles(full));
    } else if (name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
};

try {
  statSync(assetsDir);
} catch {
  console.error('[assert-production-bundle] dist/assets not found. Run vite build first.');
  process.exit(1);
}

const offenders = [];

for (const file of walkJsFiles(assetsDir)) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(BARE_IMPORT_RE)) {
    const specifier = match[1] || match[2];
    if (!specifier || isRelativeOrAbsolute(specifier)) continue;
    offenders.push({ file, specifier });
  }
}

if (offenders.length) {
  console.error('[assert-production-bundle] Bare module imports found in dist (will crash in browser):');
  for (const { file, specifier } of offenders) {
    console.error(`  - ${specifier}  (${file})`);
  }
  process.exit(1);
}

console.log('[assert-production-bundle] OK — no bare npm imports in dist/assets');
