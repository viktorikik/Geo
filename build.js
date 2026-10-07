// build.js — собирает модульный проект в один HTML
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const read = (p) => readFileSync(join(__dirname, p), 'utf8');

// Порядок модулей важен: сначала зависимости
const MODULES = [
  'src/config.js',
  'src/data.js',
  'src/core.js',
  'src/ui.js',
  'src/map.js',
  'src/quiz.js',
  'src/screens.js',
  'src/main.js',
];

function stripImportsAndExports(code) {
  return code
    // import { a, b } from './x.js';
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    // import './x.js';
    .replace(/^import\s+['"].*?['"];?\s*$/gm, '')
    // export const/let/function/class
    .replace(/^export\s+(const|let|var|function|class|async function)/gm, '$1')
    // export { a, b };
    .replace(/^export\s*\{[^}]*\};?\s*$/gm, '')
    // export default
    .replace(/^export\s+default\s+/gm, '');
}

const jsBundle = MODULES
  .map((path) => {
    const code = read(path);
    return `\n/* ===== ${path} ===== */\n${stripImportsAndExports(code)}`;
  })
  .join('\n');

const htmlTemplate = read('index.html');
const css = read('styles.css');

// Заменяем <link rel="stylesheet" href="styles.css"> на <style>
// Заменяем <script type="module" src="src/main.js"></script> на <script>…</script>
const finalHtml = htmlTemplate
  .replace(/<link[^>]*href="styles\.css"[^>]*>/, `<style>\n${css}\n</style>`)
  .replace(
    /<script\s+type="module"\s+src="src\/main\.js"><\/script>/,
    `<script>\n${jsBundle}\n</script>`
  );

mkdirSync(join(__dirname, 'dist'), { recursive: true });
writeFileSync(join(__dirname, 'dist', 'geomaster.html'), finalHtml, 'utf8');

console.log('✅ Собрано: dist/geomaster.html');
console.log(`   Размер: ${(finalHtml.length / 1024).toFixed(1)} KB`);
