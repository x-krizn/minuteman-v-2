/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Orion code wiki indexer.
 *
 * Scans `src/cartridges/orion` at the current commit and writes `index.json`
 * plus the static wiki page into the output folder (default `dist/wiki`).
 * Zero dependencies: TypeScript 7 no longer exposes `createSourceFile`, so
 * exports and JSDoc are read with a line scanner (FRAGILE: it covers the
 * `export <kind> Name` forms only; `export { a, b }` lists are not indexed).
 *
 * Usage: node scripts/build-index.mjs [--root DIR] [--out DIR] [--strict]
 * Drift between code anchors and docs anchors is a warning; `--strict` makes it fail.
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);
const ROOT = resolve(REPO, opt('--root', 'src/cartridges/orion'));
const OUT = resolve(REPO, opt('--out', 'dist/wiki'));
const STRICT = argv.includes('--strict');

const EXPORT_RE =
  /^export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(function\*?|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/;
const ANCHOR_RE = /ORION-ANCHOR:\s*([A-Z0-9-]+)/g;
/** Example IDs used in the docs to show the comment format; they are not real anchors. */
const PLACEHOLDER_IDS = new Set(['ID', 'UPPER-KEBAB-ID']);

/** Runs a git command in the repo root and returns trimmed stdout, or `''` on failure. */
function git(...args) {
  try {
    return execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/** Recursively lists files under `dir` whose names end with one of `exts`, skipping `node_modules`. */
function walk(dir, exts) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) found.push(full);
  }
  return found;
}

/** Returns the JSDoc text ending just above line index `i`, skipping blanks and anchor comments. */
function docAbove(lines, i) {
  let j = i - 1;
  while (j >= 0 && (lines[j].trim() === '' || /^\s*\/\/\s*\[?ORION-ANCHOR/.test(lines[j]))) j--;
  if (j < 0 || !lines[j].trim().endsWith('*/')) return '';
  let k = j;
  while (k >= 0 && !lines[k].includes('/**')) k--;
  if (k < 0) return '';
  return lines
    .slice(k, j + 1)
    .map((l) => l.replace(/^\s*\/?\*+\/?\s?/, '').replace(/\*\/\s*$/, '').trim())
    .filter(Boolean)
    .join(' ');
}

/** Extracts exports, anchors and line/JSDoc counts from one TypeScript source file. */
function scanSource(text, path) {
  const lines = text.split('\n');
  const exports = [];
  const anchors = [];
  lines.forEach((line, i) => {
    const m = EXPORT_RE.exec(line);
    if (m) exports.push({ kind: m[1], name: m[2], line: i + 1, doc: docAbove(lines, i) });
    for (const a of line.matchAll(ANCHOR_RE)) anchors.push({ id: a[1], path, line: i + 1 });
  });
  return { lines: lines.length, jsdoc: (text.match(/\/\*\*/g) || []).length, exports, anchors };
}

/** Counts regex matches across all source texts (used for the health table). */
function count(texts, re) {
  return texts.reduce((n, t) => n + (t.match(re) || []).length, 0);
}

const rel = (p) => relative(REPO, p).split('\\').join('/');
const srcFiles = walk(ROOT, ['.ts', '.tsx']);
const docFiles = walk(ROOT, ['.md']);
const srcTexts = srcFiles.map((f) => readFileSync(f, 'utf8'));

const files = srcFiles.map((f, i) => ({ path: rel(f), ...scanSource(srcTexts[i], rel(f)) }));
const anchors = files.flatMap((f) => f.anchors).sort((a, b) => a.id.localeCompare(b.id));
const docs = docFiles.map((f) => {
  const text = readFileSync(f, 'utf8');
  return { path: rel(f), title: (/^#\s+(.+)$/m.exec(text) || [, rel(f)])[1], text };
});

const codeIds = new Set(anchors.map((a) => a.id));
const docIds = new Set(
  docs.flatMap((d) => [...d.text.matchAll(ANCHOR_RE)].map((m) => m[1])).filter((id) => !PLACEHOLDER_IDS.has(id)),
);
const drift = {
  inCodeNotDocs: [...codeIds].filter((id) => !docIds.has(id)).sort(),
  inDocsNotCode: [...docIds].filter((id) => !codeIds.has(id)).sort(),
};

const remote = git('config', '--get', 'remote.origin.url').replace(/\.git$/, '');
const repoSlug = process.env.GITHUB_REPOSITORY || (/github\.com[:/]([\w.-]+\/[\w.-]+)$/.exec(remote) || [])[1] || '';
const index = {
  meta: {
    repo: /^[\w.-]+\/[\w.-]+$/.test(repoSlug) ? repoSlug : '',
    sha: process.env.GITHUB_SHA || git('rev-parse', 'HEAD'),
    date: git('log', '-1', '--format=%cI'),
    root: rel(ROOT),
  },
  stats: {
    sourceFiles: files.length,
    jsdocBlocks: files.reduce((n, f) => n + f.jsdoc, 0),
    filesWithoutJsdoc: files.filter((f) => f.jsdoc === 0).length,
    filesOver1000Lines: files.filter((f) => f.lines > 1000).length,
    anchors: anchors.length,
    anyCasts: count(srcTexts, /:\s*any\b|\bas any\b/g),
    tsSuppressions: count(srcTexts, /@ts-ignore|@ts-expect-error/g),
    todoFixme: count(srcTexts, /\b(TODO|FIXME)\b/g),
    networkCalls: count(srcTexts, /\bfetch\(|XMLHttpRequest|new WebSocket/g),
    addEventListener: count(srcTexts, /addEventListener/g),
    removeEventListener: count(srcTexts, /removeEventListener/g),
    setTimeout: count(srcTexts, /\bsetTimeout\(/g),
    clearTimeout: count(srcTexts, /\bclearTimeout\(/g),
    requestAnimationFrame: count(srcTexts, /requestAnimationFrame\(/g),
    cancelAnimationFrame: count(srcTexts, /cancelAnimationFrame\(/g),
  },
  drift,
  anchors,
  files: files.map(({ anchors: _a, ...f }) => f),
  docs,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index));
copyFileSync(join(HERE, 'wiki', 'index.html'), join(OUT, 'index.html'));

console.log(`[wiki] ${files.length} files, ${anchors.length} anchors, ${docs.length} docs @ ${index.meta.sha.slice(0, 7)} -> ${rel(OUT)}`);
const drifted = drift.inCodeNotDocs.length + drift.inDocsNotCode.length;
if (drifted) {
  console.warn(`[wiki] anchor drift: code-only [${drift.inCodeNotDocs}] docs-only [${drift.inDocsNotCode}]`);
  if (STRICT) process.exit(1);
}
