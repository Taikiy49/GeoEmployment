import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let conversionQueue = Promise.resolve();

const runLibreOffice = (binary, args) => new Promise((resolve, reject) => {
  const process = spawn(binary, args, {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let errorOutput = '';
  const timeout = setTimeout(() => {
    process.kill('SIGKILL');
    reject(new Error('PDF conversion timed out.'));
  }, 90_000);

  process.stderr.on('data', chunk => {
    errorOutput += chunk.toString();
  });
  process.on('error', error => {
    clearTimeout(timeout);
    reject(error);
  });
  process.on('close', code => {
    clearTimeout(timeout);
    if (code === 0) resolve();
    else reject(new Error(errorOutput.trim() || `PDF conversion exited with code ${code}.`));
  });
});

const performConversion = async (documentBuffer, extension = 'docx') => {
  const safeExtension = String(extension).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!['doc', 'docx'].includes(safeExtension)) {
    throw new Error('Only DOC and DOCX documents can be rendered to PDF.');
  }
  const temporaryRoot = process.env.PDF_TMP_DIR
    || (process.platform === 'linux' ? '/var/tmp' : tmpdir());
  const workspace = await mkdtemp(join(temporaryRoot, 'geolabs-pdf-'));
  const inputPath = join(workspace, `application.${safeExtension}`);
  const outputPath = join(workspace, 'application.pdf');
  const profilePath = join(workspace, 'libreoffice-profile');
  const binary = process.env.LIBREOFFICE_BIN || '/opt/libreoffice26.2/program/soffice';

  try {
    await writeFile(inputPath, documentBuffer, { mode: 0o600 });
    await runLibreOffice(binary, [
      '--headless',
      '--nologo',
      '--nodefault',
      '--nolockcheck',
      `-env:UserInstallation=file://${profilePath}`,
      '--convert-to',
      'pdf:writer_pdf_Export',
      '--outdir',
      workspace,
      inputPath,
    ]);
    const pdf = await readFile(outputPath);
    if (pdf.length < 5 || pdf.subarray(0, 5).toString() !== '%PDF-') {
      throw new Error('The document renderer did not produce a valid PDF.');
    }
    return pdf;
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
};

export function convertOfficeDocumentToPdf(documentBuffer, extension = 'docx') {
  const conversion = conversionQueue.then(() => performConversion(documentBuffer, extension));
  conversionQueue = conversion.catch(() => {});
  return conversion;
}

export function convertDocxToPdf(docxBuffer) {
  return convertOfficeDocumentToPdf(docxBuffer, 'docx');
}
