// Coordinates use PDF points from the top-left of the reviewed original page.
// The browser editor and completed-PDF writer must share this map.
export const APPLICATION_DOCUMENT_VERSION = 'lola-v1';
/** @typedef {{page:number,x:number,y:number,width:number,height:number}} DocumentRect */
/** @typedef {{key:string,label:string,type:string,rect?:DocumentRect,required?:boolean,requires?:string,maxLength?:number,signature?:boolean,trueText?:string,options?:Array<{value:string,label:string,rect:DocumentRect}>}} DocumentField */
/** @typedef {{key:string,label:string,filename:string,restricted:boolean,optional?:boolean,step:number,task:number,fields:DocumentField[],template?:string,transcript?:string,version?:string}} ApplicationDocument */
const rect = (x, y, width, height, page = 0) => ({ x, y, width, height, page });
const text = (key, label, box, extra = {}) => ({ key, label, type: 'text', rect: box, ...extra });
const date = (key, label, box, extra = {}) => ({ key, label, type: 'date', rect: box, ...extra });
const raceLabels = [
  'Hispanic or Latino',
  'White (not Hispanic or Latino)',
  'Black or African American (not Hispanic or Latino)',
  'Native Hawaiian or Other Pacific Islander (not Hispanic or Latino)',
  'Asian (not Hispanic or Latino)',
  'Native American or Alaska Native (not Hispanic or Latino)',
  'Two or More Races (not Hispanic or Latino)',
  'I do not wish to disclose.',
];

/** @type {ApplicationDocument[]} */
const documentDefinitions = [
  {
    key: 'application-agreements', label: 'Application agreements', filename: 'Geolabs-Application-Agreements.pdf',
    restricted: false, step: 3, task: 3,
    fields: [
      text('medInitials', "Medical policy — Applicant's Initials", rect(465, 102, 49, 12), { required: true, maxLength: 4 }),
      { key: 'canPerformDuties', type: 'checkbox', label: 'I am able to perform the essential functions of the position, with or without reasonable accommodation.', rect: rect(358, 109, 57, 13), trueText: 'Yes' },
      text('affiliations', 'Professional affiliations', rect(41, 149, 538, 14)),
      text('fcrInitials', "FCRA disclosure — Applicant's Initials", rect(465, 277, 49, 13), { required: true, maxLength: 4 }),
      text('knowEmployee', 'Do you know anyone presently working for our company?', rect(221, 318, 57, 13)),
      text('knowEmployeeName', 'If yes, who?', rect(317, 318, 264, 13)),
      { key: 'certificationAgreed', type: 'checkbox', required: true, label: 'I have read and understand the statements in the application agreements, and I certify that all information provided in this application is accurate and complete.' },
      date('certificationDate', 'Application Date', rect(42, 465, 140, 15), { required: true }),
      text('certificationSignature', "Applicant's Signature", rect(205, 465, 374, 15), { required: true, signature: true, requires: 'certificationAgreed' }),
    ],
  },
  {
    key: 'alcohol-drug-agreement', label: 'Alcohol & drug agreement', filename: 'Geolabs-Alcohol-Drug-Agreement.pdf',
    restricted: false, step: 4, task: 0,
    fields: [
      { key: 'drugTestAgreed', type: 'checkbox', required: true, label: 'I have read, understand, and agree to comply with the Alcohol & Drug Testing Program described in this document. I agree this constitutes a condition of my employment application and any future employment with Geolabs, Inc.' },
      text('drugTestSignature', 'Signature of Applicant', rect(173, 550, 291, 15), { required: true, signature: true, requires: 'drugTestAgreed' }),
      date('drugTestDate', 'Date', rect(97, 590, 370, 15), { required: true, requires: 'drugTestAgreed' }),
    ],
  },
  {
    key: 'eeo-survey', label: 'EEO survey', filename: 'Geolabs-EEO-Survey.pdf', restricted: true, optional: true, step: 5, task: 0,
    fields: [
      text('eeoName', 'Name', rect(105, 93, 254, 16)),
      date('eeoDate', 'Date', rect(408, 93, 131, 16)),
      { key: 'eeoGender', label: 'Gender', type: 'radio', options: ['Male', 'Female'].map((value, index) => ({ value, label: value, rect: rect(289.25 + index * 72, 338.35, 12.15, 12.15) })) },
      { key: 'eeoRace', label: 'Race / Ethnicity', type: 'radio', options: raceLabels.map((value, index) => ({ value, label: value, rect: rect(73.25, [402.95, 446.90, 482.20, 517.50, 552.80, 617.40, 667.35, 717.30][index], 12.15, 12.15) })) },
    ],
  },
  {
    key: 'veteran-status', label: 'Veteran status', filename: 'Geolabs-Veteran-Status.pdf', restricted: true, optional: true, step: 5, task: 1,
    fields: [
      { key: 'veteranStatus', label: 'Veteran Status', type: 'radio', options: [
        { value: 'protected', label: 'I identify as one or more of the following classifications of protected veterans', rect: rect(73.25, 346.25, 12.15, 12.15) },
        { value: 'notProtected', label: 'I am not a protected veteran', rect: rect(73.25, 688.55, 12.15, 12.15) },
        { value: 'noAnswer', label: 'I do not wish to self-identify', rect: rect(73.25, 717.85, 12.15, 12.15) },
      ] },
      text('vetSignature', 'Print Name / Signature', rect(63, 109, 263, 19, 1), { signature: true }),
      date('vetDate', 'Date', rect(343, 109, 195, 19, 1)),
    ],
  },
];

export const APPLICATION_DOCUMENTS = documentDefinitions.map(document => ({ ...document, template: `/forms/${APPLICATION_DOCUMENT_VERSION}/${document.key}.pdf`, transcript: `/forms/${APPLICATION_DOCUMENT_VERSION}/${document.key}.json`, version: APPLICATION_DOCUMENT_VERSION }));

export function getApplicationDocument(key) {
  const document = APPLICATION_DOCUMENTS.find(item => item.key === key);
  if (!document) throw new Error(`Unknown application document: ${key}`);
  return document;
}
