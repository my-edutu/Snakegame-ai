import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const roots = ['packages/shared/src', 'packages/engine/src', 'packages/ai/src', 'packages/failure/src', 'packages/simulation/src'];
const forbidden = [
  ['Math.random', /\bMath\.random\s*\(/],
  ['Date.now', /\bDate\.now\s*\(/],
  ['new Date', /\bnew\s+Date\s*\(/],
  ['performance.now', /\bperformance\.now\s*\(/],
  ['setTimeout', /\bsetTimeout\s*\(/],
  ['setInterval', /\bsetInterval\s*\(/],
  ['requestAnimationFrame', /\brequestAnimationFrame\s*\(/],
  ['window', /\bwindow\b/],
  ['document', /\bdocument\b/],
  ['localStorage', /\blocalStorage\b/],
  ['indexedDB', /\bindexedDB\b/],
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (extname(entry.name) === '.ts') files.push(path);
  }
  return files;
}

const violations = [];
for (const root of roots) {
  for (const file of await walk(root)) {
    const source = await readFile(file, 'utf8');
    for (const [label, pattern] of forbidden) {
      if (pattern.test(source)) violations.push(`${relative('.', file)}: ${label}`);
    }
  }
}

if (violations.length) {
  console.error('Forbidden nondeterministic/browser APIs found:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`Forbidden API scan passed across ${roots.join(', ')}.`);
