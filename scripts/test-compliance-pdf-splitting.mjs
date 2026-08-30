import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { extractPageTexts, splitCompliancePdfs } from '../api/split-compliance-pdfs.js';

const source = await PDFDocument.create();
const font = await source.embedFont(StandardFonts.Helvetica);
const pages = [
  'Complete Employment Application',
  '10. EEO Voluntary Self-Identification Survey',
  '11. Affirmative Action: Applicant Invitation to Self-Identify as a Protected Veteran (VEVRAA)',
  '12. Alcohol & Drug Testing Program',
  'Alcohol and drug agreement continuation',
];
for (const title of pages) {
  const page = source.addPage([612, 792]);
  page.drawText(title, { x: 50, y: 730, size: 14, font });
}
const documents = await splitCompliancePdfs(Buffer.from(await source.save()), 'Test-Applicant');
assert.equal(documents.length, 3);
assert.deepEqual(documents.map(item => item.key), ['eeo-survey', 'veteran-status', 'alcohol-drug-agreement']);
assert.deepEqual(await Promise.all(documents.map(async item => (await PDFDocument.load(item.content)).getPageCount())), [1, 1, 2]);

const documentTexts = await Promise.all(documents.map(item => extractPageTexts(item.content)));
assert.match(documentTexts[0].join(' '), /eeo voluntary self-identification/i);
assert.doesNotMatch(documentTexts[0].join(' '), /disability/i);
assert.match(documentTexts[1].join(' '), /protected veteran/i);
assert.doesNotMatch(documentTexts[2].join(' '), /application record|signature method|record status/i);
console.log('Compliance PDF splitting passed.');
