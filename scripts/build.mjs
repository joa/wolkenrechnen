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
await mkdir('dist/icons', { recursive: true });
const files = ['index.html', 'cloud.svg', 'og-image.png', 'manifest.webmanifest', 'sw.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'src/styles.css', ...modules.map(file => `src/${file}`)];
await Promise.all(files.map(file => copyFile(file, `dist/${file}`)));
console.log('GitHub-Pages-Artefakt in dist/ erstellt.');
