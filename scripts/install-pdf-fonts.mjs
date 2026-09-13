import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// Install the original freely downloadable Microsoft Core Fonts package for
// server-side document rendering. Never publish these files as website assets.
// The original package and its license are retained alongside the fonts.
// License: https://corefonts.sourceforge.net/eula.htm
const PACKAGE_URL = 'https://downloads.sourceforge.net/project/corefonts/the%20fonts/final/arial32.exe';
const PACKAGE_SHA256 = '85297a4d146e9c87ac6f74822734bdee5f4b2a722d7eaa584b7f2cbf76f478f6';
const FONT_FILES = ['Arial.TTF', 'Arialbd.TTF', 'Arialbi.TTF', 'Ariali.TTF'];
const args = process.argv.slice(2);
if (!args[0] || !isAbsolute(args[0]) || args.length > 2) {
  throw new Error('Usage: node scripts/install-pdf-fonts.mjs /usr/local/share/fonts/geolabs-arial [path/to/arial32.exe]');
}
const destination = resolve(args[0]);
if (destination === '/' || destination === process.cwd() || /\/(?:public|dist)(?:\/|$)/.test(destination)) {
  throw new Error('Choose a dedicated font directory outside the application public assets.');
}
execFileSync('cabextract', ['--version'], { stdio: 'ignore' });
execFileSync('fc-cache', ['--version'], { stdio: 'ignore' });

const workspace = await mkdtemp(join(tmpdir(), 'geolabs-arial-'));
try {
  let archive;
  if (args[1]) archive = await readFile(args[1]);
  else {
    const response = await fetch(PACKAGE_URL, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`Arial download failed (${response.status}).`);
    archive = Buffer.from(await response.arrayBuffer());
  }
  if (createHash('sha256').update(archive).digest('hex') !== PACKAGE_SHA256) {
    throw new Error('Arial package checksum did not match the verified original.');
  }
  const licenseResponse = await fetch('https://corefonts.sourceforge.net/eula.htm', { signal: AbortSignal.timeout(30_000) });
  if (!licenseResponse.ok) throw new Error(`Arial license download failed (${licenseResponse.status}).`);
  const license = await licenseResponse.text();
  if (!license.includes('Installation and Use') || !license.includes('unlimited number of copies')) {
    throw new Error('The font license response was not the expected EULA.');
  }
  const archivePath = join(workspace, 'arial32.exe');
  await writeFile(archivePath, archive, { mode: 0o600 });
  execFileSync('cabextract', ['-q', '-d', workspace, archivePath], { stdio: 'inherit' });
  // Validate the complete archive before updating an existing installation.
  for (const filename of FONT_FILES) {
    const font = await readFile(join(workspace, filename));
    if (font.length < 100_000) throw new Error(`Invalid font: ${filename}`);
  }
  await mkdir(destination, { recursive: true, mode: 0o755 });
  for (const filename of FONT_FILES) await copyFile(join(workspace, filename), join(destination, filename));
  await writeFile(join(destination, 'arial32.exe'), archive, { mode: 0o644 });
  await writeFile(join(destination, 'LICENSE.html'), license, { mode: 0o644 });
  execFileSync('fc-cache', ['-f', destination], { stdio: 'inherit' });
  console.log(`Installed Arial regular, bold, italic, and bold italic in ${destination}.`);
  console.log('Verify the renderer user resolves Arial with: fc-match Arial');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
