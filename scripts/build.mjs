import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const modules = (await readdir('src')).filter(file => file.endsWith('.mjs'));
for (const file of modules) {
  execFileSync(process.execPath, ['--check', `src/${file}`], { stdio: 'inherit' });
}

await rm('dist', { recursive: true, force: true });
await mkdir('dist/src', { recursive: true });
const files = ['index.html', 'cloud.svg', 'src/styles.css', ...modules.map(file => `src/${file}`)];
await Promise.all(files.map(file => copyFile(file, `dist/${file}`)));
console.log('GitHub-Pages-Artefakt in dist/ erstellt.');
