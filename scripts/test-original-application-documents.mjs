import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { decodePDFRawStream, PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, StandardFonts } from 'pdf-lib';
import { buildApplicationDocumentPdfs, getApplicationDocumentValues } from '../api/fill-application-documents.js';
import { extractPageTexts } from '../api/split-compliance-pdfs.js';
import { APPLICATION_DOCUMENTS } from '../shared/application-documents.js';

const source = await PDFDocument.create();
const sourcePage = source.addPage([612, 792]);
sourcePage.drawText('Original policy wording remains unchanged.', {
  x: 40, y: 750, size: 12, font: await source.embedFont(StandardFonts.Helvetica),
});
const sourceBytes = Buffer.from(await source.save());
const rectangle = (y, width = 300, height = 20) => ({ page: 0, x: 40, y, width, height });
const testDefinition = {
  key: 'fixture-form', label: 'Fixture form', filename: 'Geolabs-Fixture.pdf', template: '/unused-test-template.pdf', restricted: true,
  fields: [
    { key: 'name', label: 'Name', type: 'text', rect: rectangle(70) },
    { key: 'date', label: 'Date', type: 'date', rect: rectangle(110) },
    { key: 'signature', label: 'Signature', type: 'text', signature: true, requires: 'agreed', rect: rectangle(150) },
    { key: 'agreed', label: 'Consent', type: 'checkbox' },
    { key: 'status', label: 'Status', type: 'radio', options: [
      { value: 'yes', label: 'Yes', rect: rectangle(190, 12, 12) },
      { value: 'no', label: 'No', rect: rectangle(220, 12, 12) },
    ] },
    { key: 'able', label: 'Able to perform duties', type: 'checkbox', trueText: 'Yes', rect: rectangle(260) },
    { key: 'notes', label: 'Long response', type: 'text', rect: rectangle(300, 120) },
  ],
};

const options = { definitions: [testDefinition], readTemplate: async () => sourceBytes };
const fields = { name: 'Leilani Kealoha', date: '2026-11-22', signature: 'Leilani Kealoha SIGNED', agreed: true, status: 'yes', able: true };
const [filled] = await buildApplicationDocumentPdfs({ applicationData: fields }, 'TEST-Leilani', options);
assert.equal(filled.filename, 'TEST-Leilani-Geolabs-Fixture.pdf');
assert.equal(filled.restricted, true);
assert.equal(filled.type, 'application/pdf');
assert.deepEqual(sourceBytes, Buffer.from(await source.save()), 'Original template bytes must remain unchanged.');
const filledText = (await extractPageTexts(filled.content)).join(' ');
const signatureDocument = await PDFDocument.load(filled.content);
assert.ok(signatureDocument.context.enumerateIndirectObjects().some(([, object]) => object instanceof PDFDict && /Allura/.test(object.get(PDFName.of('BaseFont'))?.toString() || '')), 'Typed signatures must embed the bundled cursive font.');
for (const value of ['original policy wording remains unchanged', 'leilani kealoha', '2026-11-22', 'signed', 'yes']) assert.ok(filledText.includes(value));

async function pageContentOperators(bytes) {
  const document = await PDFDocument.load(bytes);
  const texts = [];
  for (const page of document.getPages()) {
    assert.equal(page.node.Annots()?.size() || 0, 0, 'Completed forms must have no interactive widgets.');
    const contents = page.node.Contents();
    const references = contents instanceof PDFArray ? contents.asArray() : contents ? [contents] : [];
    for (const reference of references) {
      const stream = document.context.lookup(reference);
      if (stream instanceof PDFRawStream) texts.push(Buffer.from(decodePDFRawStream(stream).decode()).toString('latin1'));
    }
  }
  assert.equal(document.catalog.get(PDFName.of('AcroForm')), undefined, 'Completed static forms must not retain an AcroForm tree.');
  return texts.join('\n');
}
const markedOperators = await pageContentOperators(filled.content);
assert.match(markedOperators, /42 592 m/, 'The selected radio must be marked at its mapped rectangle.');
assert.doesNotMatch(markedOperators, /42 562 m/, 'The unselected radio must remain blank.');

const [unconsented] = await buildApplicationDocumentPdfs({ applicationData: { ...fields, agreed: false, status: '', able: false } }, 'Blank', options);
const unconsentedText = (await extractPageTexts(unconsented.content)).join(' ');
assert.doesNotMatch(unconsentedText, /signed|\byes\b/, 'Unaccepted signatures and ambiguous false answers must not be printed.');
assert.doesNotMatch(await pageContentOperators(unconsented.content), /42 (592|562) m/, 'Blank optional selections must not become a selected answer.');

const longResponse = Array.from({ length: 150 }, (_, index) => `Response ${String(index).padStart(3, '0')}: retain all entered words and details.`).join('\n');
const [long] = await buildApplicationDocumentPdfs({ applicationData: { ...fields, notes: longResponse } }, 'Long', options);
const longPages = await extractPageTexts(long.content);
assert.ok(longPages.length > 2, 'Large input should create legible continuation pages, not silently clip.');
assert.match(longPages[0], /see continuation/);
assert.match(longPages[1], /additional responses.*fixture form.*long response/);
for (let index = 0; index < 150; index += 1) assert.ok(longPages.join(' ').includes(`response ${String(index).padStart(3, '0')}: retain all entered words and details.`));
await pageContentOperators(long.content);

const unicode = 'Kaʻōnohi Hawaiʻi José Muñoz';
const [unicodeForm] = await buildApplicationDocumentPdfs({ applicationData: { ...fields, name: unicode } }, 'Unicode', options);
assert.ok((await extractPageTexts(unicodeForm.content)).join(' ').includes(unicode.toLowerCase()));
// Force a limited primary character set on every platform. Modern macOS Arial
// otherwise masks the production Core Fonts Arial coverage gap.
const limitedOptions = { ...options, readFont: async () => StandardFonts.Helvetica };
const [fallbackForm] = await buildApplicationDocumentPdfs({ applicationData: { ...fields, name: unicode } }, 'Fallback', limitedOptions);
assert.ok((await extractPageTexts(fallbackForm.content)).join(' ').includes(unicode.toLowerCase()), 'Fallback must retain the exact Hawaiian and accented characters.');
const fallbackDocument = await PDFDocument.load(fallbackForm.content);
const fallbackNames = fallbackDocument.context.enumerateIndirectObjects().map(([, object]) => object instanceof PDFDict ? object.get(PDFName.of('BaseFont'))?.toString() : '').filter(Boolean);
assert.ok(fallbackNames.some(name => /NotoSans/.test(name)), 'Missing primary glyphs must use the bundled Unicode font.');
const [asciiForm] = await buildApplicationDocumentPdfs({ applicationData: fields }, 'No-fallback', {
  ...limitedOptions, readFallbackFont: async () => { throw new Error('ASCII fields must not load the fallback.'); },
});
assert.ok((await extractPageTexts(asciiForm.content)).join(' ').includes('leilani kealoha'));
const unicodeLines = Array.from({ length: 80 }, (_, index) => `Line ${index}: ${unicode}`).join('\n');
const [unicodeContinuation] = await buildApplicationDocumentPdfs({ applicationData: { ...fields, notes: unicodeLines } }, 'Fallback-continuation', limitedOptions);
const continuationText = (await extractPageTexts(unicodeContinuation.content)).join(' ');
for (let index = 0; index < 80; index += 1) assert.ok(continuationText.includes(`line ${index}: ${unicode.toLowerCase()}`), 'Continuation pages must retain fallback glyphs too.');
await assert.rejects(buildApplicationDocumentPdfs({ applicationData: { name: 'Unsupported 🧪' } }, 'Unsupported-fallback', limitedOptions), /cannot represent a character/);
await assert.rejects(buildApplicationDocumentPdfs({ applicationData: { name: 'Unsupported 🧪' } }, 'Unsupported', options), /cannot represent a character/, 'Do not generate invisible glyphs or silently erase input.');
await assert.rejects(buildApplicationDocumentPdfs({ applicationData: fields }, 'Bad-rectangle', {
  ...options, definitions: [{ ...testDefinition, fields: [{ ...testDefinition.fields[0], rect: rectangle(790) }] }],
}), /Invalid document field rectangle/);

assert.deepEqual(getApplicationDocumentValues({ applicationData: { eeoGender: 'Male', eeoRace: 'legacy', veteranStatus: 'protected' }, eeoData: { gender: '', race: 'new', veteranStatus: 'noAnswer' } }), {
  eeoGender: '', eeoRace: 'new', veteranStatus: 'noAnswer',
}, 'Explicit blank current values override legacy responses.');
assert.equal(getApplicationDocumentValues({ applicationData: { eeoGender: 'Female' } }).eeoGender, 'Female');

// Exercise the real checked-in original forms as well as synthetic edge cases.
const application = {
  id: 'ORIGINAL-FORMS-TEST',
  applicationData: {
    eeoName: 'Leilani Kealoha', eeoDate: '2026-11-22',
    vetSignature: 'Leilani Kealoha', vetDate: '2026-11-22',
    drugTestAgreed: true, drugTestSignature: 'Leilani Kealoha', drugTestDate: '2026-11-22',
    medInitials: 'LK', fcrInitials: 'LK', canPerformDuties: true,
    affiliations: 'Hawaii Engineering Association', knowEmployee: 'Yes', knowEmployeeName: 'Example Colleague',
    certificationAgreed: true, certificationSignature: 'Leilani Kealoha', certificationDate: '2026-11-22',
  },
  eeoData: { gender: 'Female', race: 'Asian (not Hispanic or Latino)', veteranStatus: 'noAnswer' },
};
const realForms = await buildApplicationDocumentPdfs(application, 'TEST-Leilani');
assert.deepEqual(realForms.map(form => form.key), ['application-agreements', 'alcohol-drug-agreement', 'eeo-survey', 'veteran-status']);
assert.deepEqual(realForms.filter(form => form.restricted).map(form => form.key), ['eeo-survey', 'veteran-status']);
for (const form of realForms) {
  const originalDefinition = APPLICATION_DOCUMENTS.find(definition => definition.key === form.key);
  const originalBytes = await readFile(new URL(`../public${originalDefinition.template}`, import.meta.url));
  const originalText = await extractPageTexts(originalBytes);
  const renderedText = await extractPageTexts(form.content);
  assert.equal(renderedText.length, originalText.length, 'Ordinary responses must fit the original page count.');
  assert.ok(renderedText.join(' ').includes('leilani kealoha'), `${form.label} must contain the entered name.`);
  for (let index = 0; index < originalText.length; index += 1) {
    assert.ok(renderedText[index].startsWith(originalText[index]), `${form.label} must retain the exact source page text before response overlays.`);
  }
  const doc = await PDFDocument.load(form.content);
  const fonts = doc.context.enumerateIndirectObjects().map(([, object]) => object instanceof PDFDict ? object.get(PDFName.of('BaseFont'))?.toString() : '').filter(Boolean);
  assert.ok(fonts.some(font => /Arial/i.test(font)), `${form.label} must embed actual Arial for responses.`);
  await pageContentOperators(form.content);
}
assert.equal(realForms.some(form => /disability/i.test(form.key)), false);
if (process.env.PDF_TEST_OUTPUT_DIR) {
  await mkdir(process.env.PDF_TEST_OUTPUT_DIR, { recursive: true });
  for (const form of realForms) await writeFile(join(process.env.PDF_TEST_OUTPUT_DIR, form.filename), form.content);
  await writeFile(join(process.env.PDF_TEST_OUTPUT_DIR, 'TEST-Long-Continuation.pdf'), long.content);
  await writeFile(join(process.env.PDF_TEST_OUTPUT_DIR, 'TEST-Unicode-Fallback.pdf'), fallbackForm.content);
  await writeFile(join(process.env.PDF_TEST_OUTPUT_DIR, 'TEST-Unicode-Continuation.pdf'), unicodeContinuation.content);
}
console.log('Original PDF forms passed: source fidelity, all four output documents, consent, selection coordinates, optional blanks, legacy mapping, Arial, Hawaiian diacritics, overflow continuation, invalid rectangles, and static output. No emails sent.');
