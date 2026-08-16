import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs']);

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
};

const violations = [];
const scan = async (directory, forbidden, label) => {
  const files = await walk(join(ROOT, directory));
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const pattern of forbidden) {
      if (pattern.test(content)) {
        violations.push(`${label}: ${relative(ROOT, file)} matches ${pattern}`);
      }
    }
  }
};

await scan(
  'packages/renderer/src',
  [
    /from\s+['"]@snake\/(?:engine|ai|failure|simulation|levels)['"]/,
    /import\s*\(\s*['"]@snake\/(?:engine|ai|failure|simulation|levels)['"]\s*\)/,
    /from\s+['"](?:react|next(?:\/[^'"]*)?)['"]/,
    /\bMath\.random\s*\(/,
    /\bDate\.now\s*\(/,
  ],
  'renderer must remain presentation-only',
);

await scan(
  'apps/render-preview/src',
  [
    /from\s+['"]@snake\/(?:engine|ai|failure|simulation|levels)['"]/,
    /import\s*\(\s*['"]@snake\/(?:engine|ai|failure|simulation|levels)['"]\s*\)/,
  ],
  'preview must consume only public renderer contracts',
);

for (const core of ['shared', 'engine', 'ai', 'levels', 'failure', 'simulation']) {
  await scan(
    `packages/${core}/src`,
    [
      /from\s+['"]@snake\/renderer['"]/,
      /import\s*\(\s*['"]@snake\/renderer['"]\s*\)/,
      /from\s+['"]pixi\.js['"]/,
    ],
    `deterministic package ${core} must not depend on rendering`,
  );
}

if (violations.length > 0) {
  console.error('Renderer architecture boundary violations:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('renderer architecture boundaries: PASS');
