import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const walkSourceFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkSourceFiles(entryPath) : [entryPath];
  });

const getTrackedFiles = () => {
  try {
    return execFileSync('git', ['ls-files', 'src'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return walkSourceFiles('src');
  }
};

const trackedFiles = getTrackedFiles().map((file) => file.replaceAll('\\', '/'));

const exactPaths = new Set(trackedFiles);
const pathsByLowerCase = new Map(
  trackedFiles.map((file) => [file.toLowerCase(), file]),
);
const sourceFiles = trackedFiles.filter((file) => /\.(?:ts|tsx|js|jsx)$/.test(file));
const extensions = [
  '',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '/index.ts',
  '/index.tsx',
  '/index.js',
  '/index.jsx',
];
const importPattern =
  /\bfrom\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]/gm;
const errors = [];

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');

  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1] || match[2] || match[3];
    if (!specifier?.startsWith('.')) continue;

    const basePath = path.posix.normalize(
      path.posix.join(path.posix.dirname(file), specifier),
    );
    const candidates = path.posix.extname(basePath)
      ? [basePath]
      : extensions.map((extension) => basePath + extension);

    if (candidates.some((candidate) => exactPaths.has(candidate))) continue;

    const caseInsensitiveMatch = candidates
      .map((candidate) => pathsByLowerCase.get(candidate.toLowerCase()))
      .find(Boolean);

    errors.push(
      caseInsensitiveMatch
        ? `${file}: ${specifier} difere de ${caseInsensitiveMatch}`
        : `${file}: ${specifier} não existe nos arquivos registrados no Git`,
    );
  }
}

if (errors.length > 0) {
  console.error('Imports relativos inválidos:\n' + errors.join('\n'));
  process.exit(1);
}

console.log('Imports relativos validados com capitalização exata.');
