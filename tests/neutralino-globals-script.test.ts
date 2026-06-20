import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('Neutralino globals build guard', () => {
  it('restores a stale dev server globals URL before packaging', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mrgallery-globals-'));
    const htmlPath = join(dir, 'index.html');

    await writeFile(htmlPath, [
      '<!doctype html>',
      '<html>',
      '  <head>',
      '    <script src="http://localhost:57129/__neutralino_globals.js"></script>',
      '  </head>',
      '</html>'
    ].join('\n'));

    await execFileAsync('node', ['scripts/restore-neutralino-globals.mjs', htmlPath], {
      cwd: process.cwd()
    });

    await expect(readFile(htmlPath, 'utf8')).resolves.toContain(
      '<script src="__neutralino_globals.js"></script>'
    );
  });
});
