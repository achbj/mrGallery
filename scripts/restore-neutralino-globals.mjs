import { readFileSync, writeFileSync } from 'node:fs';

const DEFAULT_HTML_PATH = 'index.html';
const DEV_GLOBALS_PATTERN = /(<script\s+src=")(?:https?:\/\/(?:localhost|127\.0\.0\.1):\d+\/)?__neutralino_globals\.js("\s*><\/script>)/;

export function restoreNeutralinoGlobals(html) {
  return html.replace(DEV_GLOBALS_PATTERN, '$1__neutralino_globals.js$2');
}

const scriptPath = new URL(import.meta.url).pathname;
const invokedPath = process.argv[1] ? new URL(`file://${process.argv[1]}`).pathname : '';

if (scriptPath === invokedPath) {
  const htmlPath = process.argv[2] ?? DEFAULT_HTML_PATH;
  const html = readFileSync(htmlPath, 'utf8');
  const restored = restoreNeutralinoGlobals(html);

  if (restored !== html) {
    writeFileSync(htmlPath, restored);
    console.log(`Restored Neutralino globals script in ${htmlPath}`);
  }
}
