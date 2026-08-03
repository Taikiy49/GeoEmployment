import assert from 'node:assert/strict';
import { normalizeSkillCategories, sanitizeResult } from '../api/parse-resume.js';
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

console.log('Resume autofill sanitization and safe merge passed.');
