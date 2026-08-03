const scalarFields = [
  'firstName', 'middleName', 'lastName', 'address', 'city', 'state', 'zip', 'email',
  'driverLicense', 'highestEducationLevel', 'skillsYearsExperience', 'skillsPrimaryFocus',
  'skillsTechnical', 'skillsCommunication', 'certifications', 'fieldLabExperience',
  'computerSkills', 'skillsSummary', 'professionalOrgs', 'professionalLicenses', 'affiliations',
];

const isBlank = value => value === undefined || value === null || String(value).trim() === '';
const hasContent = record => Object.values(record || {}).some(value => !isBlank(value));

const mergeRecords = (existing, extracted, identityField, maximum) => {
  const result = (Array.isArray(existing) ? existing : []).map(item => ({ ...item }));
  for (const extractedItem of (Array.isArray(extracted) ? extracted : []).filter(hasContent)) {
    const identity = String(extractedItem?.[identityField] || '').trim().toLowerCase();
    let index = identity
      ? result.findIndex(item => String(item?.[identityField] || '').trim().toLowerCase() === identity)
      : -1;
    if (index < 0) index = result.findIndex(item => !hasContent(item));
    if (index < 0 && result.length < maximum) {
      result.push({});
      index = result.length - 1;
    }
    if (index < 0) continue;
    result[index] = Object.fromEntries(
      [...new Set([...Object.keys(result[index] || {}), ...Object.keys(extractedItem || {})])]
        .map(field => [field, isBlank(result[index]?.[field]) ? (extractedItem?.[field] || '') : result[index][field]]),
    );
  }
  return result.slice(0, maximum);
};

export function mergeResumeAutofill(current, extracted, metadata = {}) {
  const next = { ...current };
  for (const field of scalarFields) {
    if (isBlank(next[field]) && !isBlank(extracted?.[field])) next[field] = extracted[field];
  }
  if (isBlank(next.cell) && !isBlank(extracted?.phone)) next.cell = extracted.phone;
  next.employment = mergeRecords(current.employment, extracted?.employment, 'company', 3);
  next.education = mergeRecords(current.education, extracted?.education, 'institution', 3);
  next.references = mergeRecords(current.references, extracted?.references, 'name', 3);
  next.resumeAutoFillTimestamp = new Date().toISOString();
  next.resumeAutoFillModel = metadata.model || '';
  next.resumeAutoFillFields = countResumeValues(extracted);
  return next;
}

export function countResumeValues(data) {
  let count = 0;
  for (const field of [...scalarFields, 'phone']) if (!isBlank(data?.[field])) count += 1;
  for (const collection of ['employment', 'education', 'references']) {
    for (const record of (Array.isArray(data?.[collection]) ? data[collection] : [])) {
      count += Object.values(record || {}).filter(value => !isBlank(value)).length;
    }
  }
  return count;
}

export function summarizeResumeData(data) {
  const items = [];
  const name = [data?.firstName, data?.middleName, data?.lastName].filter(Boolean).join(' ');
  if (name || data?.email || data?.phone || data?.address) items.push({ label: 'Contact details', count: [name, data?.email, data?.phone, data?.address].filter(Boolean).length });
  if (data?.employment?.length) items.push({ label: 'Employment history', count: data.employment.length });
  if (data?.education?.length || data?.highestEducationLevel) items.push({ label: 'Education', count: data.education?.length || 1 });
  const skills = ['skillsPrimaryFocus', 'skillsTechnical', 'skillsCommunication', 'fieldLabExperience', 'computerSkills', 'skillsSummary'].filter(field => data?.[field]).length;
  if (skills) items.push({ label: 'Skills and experience', count: skills });
  const credentials = ['certifications', 'professionalOrgs', 'professionalLicenses', 'affiliations'].filter(field => data?.[field]).length;
  if (credentials) items.push({ label: 'Credentials and memberships', count: credentials });
  if (data?.references?.length) items.push({ label: 'Professional references', count: data.references.length });
  return items;
}
