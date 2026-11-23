import React from 'react';
import FormSection from '../app/FormSection';
import NavigationButtons from '../app/NavigationButtons';
import DocumentEditor from '../app/DocumentEditor';

const CERTIFICATION_FIELDS = [
  'fcrInitials',
  'knowEmployee',
  'knowEmployeeName',
  'certificationAgreed',
  'certificationSignature',
  'certificationDate',
];

export default function CertificationStep({ formData, setFormData, onNext, onBack, onDocumentChange }) {
  return (
    <div>
      <FormSection
        title="Employment Certification & Disclosures"
        description="Please review each disclosure carefully and provide your initials and signature where requested."
      >
        <DocumentEditor documentKey="application-agreements" fieldKeys={CERTIFICATION_FIELDS} formData={formData} setFormData={setFormData} onDocumentChange={onDocumentChange} />
      </FormSection>
      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
