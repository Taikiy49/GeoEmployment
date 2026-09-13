import { createHash, randomUUID } from 'node:crypto';
import { MAX_RESUME_BYTES, RESUME_SIZE_ERROR } from '../src/lib/resumeLimits.js';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const requiredFields = [
  ['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email address'],
  ['address', 'Street address'], ['city', 'City'], ['state', 'State'], ['zip', 'ZIP code'],
  ['positionAppliedFor', 'Position applied for'], ['preferredLocation', 'Preferred office location'],
  ['certifyInitials', 'Reference authorization initials'], ['medInitials', 'Medical-policy acknowledgment initials'],
  ['fcrInitials', 'FCRA disclosure initials'], ['highestEducationLevel', 'Highest education level'],
];
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const canonicalJson = value => JSON.stringify(value, (_key, item) => isObject(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);

export function normalizeSubmission(body) {
  if (!isObject(body) || !isObject(body.applicationData)) {
    throw new Error('A completed application is required.');
  }
  const data = { ...body.applicationData };
  const missing = requiredFields.filter(([key]) => typeof data[key] !== 'string' || !data[key].trim()).map(([, label]) => label);
  for (const [prefix, label] of [['certification', 'Employment Certification'], ['drugTest', 'Alcohol & Drug Testing agreement']]) {
    if (data[`${prefix}Agreed`] !== true || typeof data[`${prefix}Signature`] !== 'string'
      || !data[`${prefix}Signature`].trim() || !validDate(data[`${prefix}Date`])) missing.push(`Sign, date, and accept the ${label}`);
  }
  if (missing.length) throw new Error(`Complete these required items before submitting: ${missing.join('; ')}.`);
  data.email = data.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('Enter a valid email address.');
  for (const field of ['employment', 'education', 'references']) {
    if (data[field] !== undefined && (!Array.isArray(data[field]) || data[field].some(item => !isObject(item)))) {
      throw new Error(`Invalid ${field} entries.`);
    }
  }
  if (body.id !== undefined && (typeof body.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,127}$/i.test(body.id))) {
    throw new Error('Invalid application reference.');
  }
  const resume = body.resumeAttachment;
  if (resume != null && (!isObject(resume) || typeof resume.filename !== 'string' || !resume.filename.trim()
    || typeof resume.content !== 'string' || !resume.content || !/^[A-Za-z0-9+/]*={0,2}$/.test(resume.content)
    || resume.content.length % 4 !== 0)) throw new Error('The résumé attachment is invalid. Please attach it again.');
  if (resume && Buffer.byteLength(resume.content, 'base64') > MAX_RESUME_BYTES) {
    throw Object.assign(new Error(RESUME_SIZE_ERROR), { status: 413 });
  }
  // Remove obsolete/sensitive transient fields before storing the signed application.
  for (const key of Object.keys(data)) {
    if (key.startsWith('disability') || ['resumeAttachment', 'resumeParsedPreview', 'resumeFileUrl'].includes(key)) delete data[key];
  }
  const now = new Date().toISOString();
  const application = {
    id: body.id || randomUUID(),
    requisitionId: typeof body.requisitionId === 'string' ? body.requisitionId : null,
    requisitionTitle: typeof body.requisitionTitle === 'string' ? body.requisitionTitle : data.positionAppliedFor,
    firstName: data.firstName.trim(), lastName: data.lastName.trim(), email: data.email,
    phone: data.phone || data.cell || '', positionAppliedFor: data.positionAppliedFor,
    preferredLocation: data.preferredLocation, applicationData: data,
    eeoData: Object.fromEntries(['gender', 'race', 'veteranStatus'].map(key => [key, typeof body.eeoData?.[key] === 'string' ? body.eeoData[key] : ''])),
    ...(resume ? { resumeAttachment: { filename: resume.filename, content: resume.content, type: typeof resume.type === 'string' ? resume.type : 'application/octet-stream' } } : {}),
  };
  const submissionFingerprint = createHash('sha256').update(canonicalJson(application)).digest('hex');
  return {
    ...application, submissionFingerprint, submittedAt: now,
    isDraft: false, stage: 'applied', status: 'active', source: 'applicant_portal',
    stageHistory: [{ stage: 'applied', changedAt: now, changedBy: 'applicant', note: 'Application submitted' }],
    auditTrail: [{ action: 'Application submitted', performedBy: application.email, performedAt: now, details: 'Initial submission via applicant portal' }],
  };
}
