import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PDFDict, PDFDocument, PDFName } from 'pdf-lib';
import { buildApplicationDocx } from '../api/generate-application-docx.js';
import { convertDocxToPdf } from '../api/convert-docx-to-pdf.js';
import { extractPageTexts, splitCompliancePdfs } from '../api/split-compliance-pdfs.js';

const application = {
  id: 'PACKAGE-LAYOUT-TEST',
  firstName: 'Package',
  lastName: 'Test',
  email: 'package-test@example.com',
  submittedAt: '2026-08-10T12:00:00-10:00',
  requisitionTitle: 'Engineering Technician or Trainee (Field)',
  applicationData: {
    firstName: 'Package', lastName: 'Test', email: 'package-test@example.com',
    applicationDate: '2026-08-10', positionAppliedFor: 'Engineering Technician or Trainee (Field)',
    employment: [{ company: 'Example Company', position: 'Technician', dateFrom: '2025-01', duties: 'Tested equipment and documented results.' }],
    education: [{ institution: 'Example University', degree: 'B.S.', field: 'Engineering', yearCompleted: '2025' }],
    references: [{ name: 'Example Reference', title: 'Project Manager', company: 'Example Company', phone: '(808) 555-0100' }],
    certificationAgreed: true, certificationSignature: 'Package Test', certificationDate: '2026-08-10',
    drugTestAgreed: true, drugTestSignature: 'Package Test', drugTestDate: '2026-08-10',
    vetSignature: 'Package Test', vetDate: '2026-08-10',
  },
  eeoData: { gender: '', race: 'I do not wish to disclose.', veteranStatus: 'noAnswer' },
};

async function assertArialFonts(pdf, label) {
  if (process.env.REQUIRE_ARIAL_PDF !== '1') return;
  const document = await PDFDocument.load(pdf);
  const fonts = document.context.enumerateIndirectObjects()
    .map(([, object]) => object instanceof PDFDict ? object.get(PDFName.of('BaseFont'))?.toString() : '')
    .filter(Boolean);
  assert.ok(fonts.some(font => /Arial(?:MT)?(?:-|$)/i.test(font)), `${label} must embed actual Arial, not a substituted font.`);
  assert.ok(fonts.some(font => /Arial.*Bold/i.test(font)), `${label} must embed Arial Bold.`);
  assert.ok(!fonts.some(font => /Helvetica/i.test(font)), `${label} must use Arial for its footer too.`);
}

const mainPdf = await convertDocxToPdf(await buildApplicationDocx(application, { mainApplicationOnly: true }));
await assertArialFonts(mainPdf, 'Main application');
const mainPageCount = (await PDFDocument.load(mainPdf)).getPageCount();
const mainText = (await extractPageTexts(mainPdf)).join(' ');
assert.match(mainText, /9\. employment certification/i);
assert.doesNotMatch(mainText, /eeo voluntary self-identification|voluntary self-identification of disability|protected veteran \(vevraa\)|alcohol & drug testing program|application record/i);
assert.doesNotMatch(mainText, /application contents|open this document in microsoft word|draft record/i);
assert.doesNotMatch(mainText, /application source|resume storage reference|resume processing timestamp|signature method|record status|application record/i);
assert.doesNotMatch(mainText, /education 2|education 3/i, 'Blank education entries must not print.');
assert.match(mainText, /certain family court matters will not be considered/i);
assert.match(mainText, /any specimen obtained by the physician/i);
assert.match(mainText, /original documents establishing your identity and authorization to work/i);
assert.match(mainText, /reference 1 of 1/i);
assert.match(mainText, /do you know anyone presently working for our company/i);
assert.ok(mainPageCount < 12, `The continuous layout should use fewer than the former 12 pages (received ${mainPageCount}).`);
assert.match(mainText, new RegExp(`page ${mainPageCount} of ${mainPageCount}`, 'i'));

const completePdf = await convertDocxToPdf(await buildApplicationDocx(application, { omitFooter: true }));
const forms = await splitCompliancePdfs(completePdf, 'Package-Test');
assert.equal(forms.length, 3);
const formPageCounts = {};
for (const form of forms) {
  await assertArialFonts(form.content, form.label);
  const pageCount = (await PDFDocument.load(form.content)).getPageCount();
  formPageCounts[form.key] = pageCount;
  const pageTexts = await extractPageTexts(form.content);
  assert.match(pageTexts[0], new RegExp(`page 1 of ${pageCount}`, 'i'), `${form.label} must restart at page 1.`);
  assert.match(pageTexts.at(-1), new RegExp(`page ${pageCount} of ${pageCount}`, 'i'), `${form.label} must report its own final page count.`);
  for (const pageText of pageTexts) {
    assert.equal((pageText.match(/page \d+ of \d+/g) || []).length, 1,
      `${form.label} must contain only its own page number, including text read by screen readers.`);
  }
}

const formTextByKey = Object.fromEntries(await Promise.all(forms.map(async form => [
  form.key,
  (await extractPageTexts(form.content)).join(' '),
])));
assert.match(formTextByKey['eeo-survey'], /select one option[\s\S]*male[\s\S]*female/i);
assert.match(formTextByKey['eeo-survey'], /identifying as hispanic or latino and only one of the listed five race groups does not qualify/i);
const genderChoices = formTextByKey['eeo-survey'].match(/gender([\s\S]*?)race \/ ethnicity/i)?.[1] || '';
assert.doesNotMatch(genderChoices, /i do not wish to disclose/i);
assert.match(formTextByKey['veteran-status'], /select one option[\s\S]*i identify as one or more[\s\S]*i am not a protected veteran[\s\S]*i do not wish to self-identify/i);
assert.match(formTextByKey['veteran-status'], /receipt of military retired pay/i);
assert.match(formTextByKey['veteran-status'], /61 fr 129, 3 cfr, 1996 comp\., p\. 159/i);
assert.match(formTextByKey['veteran-status'], /print name \/ signature/i);
assert.doesNotMatch(formTextByKey['veteran-status'], /\bnoanswer\b/i);
assert.match(formTextByKey['alcohol-drug-agreement'], /any applicant who is unwilling to agree to these conditions should not apply/i);
assert.match(formTextByKey['alcohol-drug-agreement'], /agreement of applicant to comply with geolabs, inc\. alcohol and drug testing program/i);
assert.match(formTextByKey['alcohol-drug-agreement'], /to be completed by all applicants for all positions/i);
assert.match(formTextByKey['alcohol-drug-agreement'], /will be required to ask my physician to change my prescription/i);
assert.equal(formPageCounts['alcohol-drug-agreement'], 1, 'The Alcohol & Drug Testing Agreement should fit on one readable page.');
assert.equal(formPageCounts['disability-form'], undefined, 'The discontinued disability self-identification form must not be generated.');
for (const form of forms) {
  const formText = (await extractPageTexts(form.content)).join(' ');
  assert.doesNotMatch(formText, /signature method|application id|submission timestamp|record status/i);
}

// A duties row can span more than one page. Verify that every original bullet
// survives PDF conversion, including the final response after that long row.
const longDutyBullets = Array.from({ length: 37 }, (_, index) =>
  `Responsibility ${String(index + 1).padStart(2, '0')}: Prepared and verified laboratory samples, documented results, and maintained equipment.`);
const longApplication = {
  ...application,
  applicationData: {
    ...application.applicationData,
    employment: [{
      ...application.applicationData.employment[0],
      duties: longDutyBullets.join('\n'),
      reasonForLeaving: 'Completed the documented project assignment',
    }],
    education: [...application.applicationData.education, { institution: '', degree: '', field: '', yearCompleted: '' }],
  },
};
const longPdf = await convertDocxToPdf(await buildApplicationDocx(longApplication, { mainApplicationOnly: true }));
const longText = (await extractPageTexts(longPdf)).join(' ');
for (const bullet of longDutyBullets) assert.ok(longText.includes(bullet.toLowerCase()), `Lost duties bullet: ${bullet}`);
assert.match(longText, /completed the documented project assignment/);
assert.doesNotMatch(longText, /education 2/);
assert.match(longText, /applicant's signature[\s\S]*package test/);

if (process.env.PDF_TEST_OUTPUT_DIR) {
  await mkdir(process.env.PDF_TEST_OUTPUT_DIR, { recursive: true });
  await writeFile(join(process.env.PDF_TEST_OUTPUT_DIR, 'Package-Test-Geolabs-Application.pdf'), mainPdf);
  for (const form of forms) await writeFile(join(process.env.PDF_TEST_OUTPUT_DIR, form.filename), form.content);
  await writeFile(join(process.env.PDF_TEST_OUTPUT_DIR, 'Package-Test-Long-Duties.pdf'), longPdf);
}

console.log(`PDF package layout passed: supervisor application ${mainPageCount} pages; compliance pages ${JSON.stringify(formPageCounts)}.`);
