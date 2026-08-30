import assert from 'node:assert/strict';
import { normalizeSkillCategories, normalizeState, normalizeStreetAddress, sanitizeResult } from '../api/parse-resume.js';
import { countResumeValues, mergeResumeAutofill } from '../src/lib/resumeAutofill.js';
import { INITIAL_FORM_DATA } from '../src/lib/initialFormData.js';

const parsed = sanitizeResult({
  data: {
    firstName: 'Leilani',
    lastName: 'Kawamoto',
    email: 'leilani@example.com',
    phone: '(808) 555-0101',
    state: 'hi',
    zip: '96797',
    highestEducationLevel: 'bachelor',
    employment: [{ company: 'Pacific Materials Lab', position: 'Lab Technician', dateFrom: '2023-06', dateTo: '' }],
    education: [{ institution: 'University of Hawaiʻi', degree: 'B.S.', field: 'Civil Engineering', yearCompleted: '2023' }],
    references: [{ name: 'Malia Spencer', company: 'Pacific Materials Lab', phone: '(808) 555-0110' }],
    skillsTechnical: 'Soil classification and compaction testing',
    explicitSkills: ['Soil classification and compaction testing'],
  },
  evidence: [{ field: 'firstName', source: 'Leilani Kawamoto', confidence: 'high' }],
  warnings: [],
});

assert.equal(parsed.data.state, 'HI');
assert.equal(parsed.data.employment[0].dateFrom, '2023-06');
assert.equal(parsed.data.highestEducationLevel, 'bachelor');

const current = {
  ...INITIAL_FORM_DATA,
  firstName: 'Applicant-entered name',
  certificationSignature: 'Must remain untouched',
  eeoGender: 'Must remain untouched',
};
const merged = mergeResumeAutofill(current, parsed.data, { model: 'test-model' });

assert.equal(merged.firstName, 'Applicant-entered name', 'Autofill must not overwrite an existing answer.');
assert.equal(merged.lastName, 'Kawamoto');
assert.equal(merged.cell, '(808) 555-0101');
assert.equal(merged.employment[0].company, 'Pacific Materials Lab');
assert.equal(merged.education[0].institution, 'University of Hawaiʻi');
assert.equal(merged.references[0].name, 'Malia Spencer');
assert.equal(merged.certificationSignature, 'Must remain untouched');
assert.equal(merged.eeoGender, 'Must remain untouched');
assert.equal(merged.resumeAutoFillModel, 'test-model');
assert.ok(countResumeValues(parsed.data) > 10);

const vianneSkills = normalizeSkillCategories({
  skillsTechnical: 'Onshape, Solidworks, soldering, circuit assembly, data analysis, Microsoft Office',
  computerSkills: 'Onshape, Solidworks, data analysis, Microsoft Office',
  skillsCommunication: 'presentation, graphic design, leadership, organization, customer service',
  skillsSummary: 'Onshape, Solidworks, soldering, circuit assembly, data analysis, presentation, graphic design, leadership, organization, customer service, Microsoft Office',
});
assert.equal(vianneSkills.skillsTechnical, 'soldering, circuit assembly, data analysis');
assert.equal(vianneSkills.computerSkills, 'Onshape, Solidworks, Microsoft Office');
assert.equal(vianneSkills.skillsCommunication, 'presentation, leadership, organization, customer service');
assert.equal(vianneSkills.skillsSummary, 'graphic design');

const allCategorizedSkills = [
  vianneSkills.skillsTechnical,
  vianneSkills.computerSkills,
  vianneSkills.skillsCommunication,
  vianneSkills.skillsSummary,
].flatMap(value => value.split(', ')).map(value => value.toLowerCase());
assert.equal(new Set(allCategorizedSkills).size, allCategorizedSkills.length, 'No skill may appear in more than one category.');

assert.equal(normalizeState('Hawaiʻi'), 'HI');
assert.equal(normalizeState("Hawai'i"), 'HI');
assert.equal(normalizeStreetAddress('Oceanside, CA 92056', 'Oceanside', 'CA', '92056'), '');
assert.equal(normalizeStreetAddress('123 Ocean View Dr, Oceanside, CA 92056', 'Oceanside', 'CA', '92056'), '123 Ocean View Dr');

const vianneRegression = sanitizeResult({
  data: {
    address: 'Oceanside, CA 92056', city: 'Oceanside', state: "Hawai'i", zip: '92056',
    highestEducationLevel: 'bachelor',
    education: [{ institution: 'Ohio University', degree: 'M.S.' }],
    employment: [{
      company: 'Sea View Pharmacy', position: 'Compounding Pharmacy Technician',
      dateFrom: '2025-01', duties: 'Fill and verify prescription medications in a sterile environment.',
    }],
    skillsTechnical: 'Quality control, Work in a fast-paced environment which requires strong multitasking skills, Cleaned and disinfected nurses stations',
    computerSkills: 'Microsoft Office, data entry',
    skillsCommunication: 'Obedience Training, customer service, Provided kind and friendly service to guests and staff',
    skillsSummary: 'Microsoft Office, customer service, adaptability',
    explicitSkills: ['Quality control', 'Microsoft Office', 'data entry', 'customer service', 'adaptability'],
  },
  warnings: [
    'January 2025 is a future start date.',
    'Employment dateFrom 2025-08 for INVO HEALTHCARE is in the future.',
    'The experience entry is missing a start date.',
    'The experience entry has no duties.',
  ],
}, new Date('2026-08-07T12:00:00-10:00'));

assert.equal(vianneRegression.data.address, '');
assert.equal(vianneRegression.data.state, 'HI');
assert.equal(vianneRegression.data.highestEducationLevel, 'master');
assert.equal(vianneRegression.warnings.length, 0);
assert.equal(vianneRegression.data.skillsTechnical, 'Quality control');
assert.equal(vianneRegression.data.computerSkills, 'Microsoft Office, data entry');
assert.equal(vianneRegression.data.skillsCommunication, 'customer service');
assert.equal(vianneRegression.data.skillsSummary, 'adaptability');
assert.doesNotMatch(Object.values(vianneRegression.data).join(' '), /Obedience Training|fast-paced environment|friendly service/i);

const longDuties = Array.from({ length: 35 }, (_, index) => `Responsibility ${index + 1}: completed documented equipment task number ${index + 1}.`).join('\n');
const dutiesRegression = sanitizeResult({
  data: {
    employment: [{ company: 'BDSmktg', duties: longDuties }],
    skillsTechnical: 'Quality Assurance, invasive species management, mechanical removal',
    skillsCommunication: 'Customer Service, phone triage, scheduling appointments',
    computerSkills: 'GPS and route planning',
    skillsSummary: 'Attention to detail',
    fieldLabExperience: 'Wetland surveys, invasive-species fieldwork, and environmental observations.',
    explicitSkills: ['Quality Assurance', 'Customer Service', 'GPS and route planning', 'Attention to detail'],
  },
  warnings: [],
});
assert.equal(dutiesRegression.data.employment[0].duties, longDuties, 'All employment bullets must survive beyond the former 600-character limit.');
assert.ok(dutiesRegression.data.employment[0].duties.length > 600);
assert.equal(dutiesRegression.data.skillsTechnical, 'Quality Assurance');
assert.equal(dutiesRegression.data.computerSkills, 'GPS and route planning');
assert.equal(dutiesRegression.data.skillsCommunication, 'Customer Service');
assert.equal(dutiesRegression.data.skillsSummary, 'Attention to detail');
assert.match(dutiesRegression.data.fieldLabExperience, /invasive-species fieldwork/);
assert.doesNotMatch([
  dutiesRegression.data.skillsTechnical,
  dutiesRegression.data.computerSkills,
  dutiesRegression.data.skillsCommunication,
  dutiesRegression.data.skillsSummary,
].join(' '), /invasive species management|mechanical removal|phone triage|scheduling appointments/i);

const refinedSkills = normalizeSkillCategories({
  skillsTechnical: 'De-Escalation, quality control',
  computerSkills: '',
  skillsCommunication: 'Strong attention to detail, conflict resolution',
  skillsSummary: 'Attention to detail, adaptability',
});
assert.equal(refinedSkills.skillsTechnical, 'quality control');
assert.equal(refinedSkills.skillsCommunication, 'De-Escalation, conflict resolution');
assert.equal(refinedSkills.skillsSummary, 'Attention to detail, adaptability');
assert.equal([
  ...refinedSkills.skillsTechnical.split(', '),
  ...refinedSkills.skillsCommunication.split(', '),
  ...refinedSkills.skillsSummary.split(', '),
].filter(value => /attention to detail/i.test(value)).length, 1);

console.log('Resume autofill sanitization and safe merge passed.');
