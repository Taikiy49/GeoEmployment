import React from 'react';
import NavigationButtons from '../app/NavigationButtons';
import DocumentEditor from '../app/DocumentEditor';

export default function AlcoholDrugStep({ formData, setFormData, onNext, onBack, onDocumentChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Agreement to Comply with Geolabs, Inc. Alcohol &amp; Drug Testing Program</h2>
        <p className="mt-1 text-sm text-brand-muted">
          To be completed by all applicants for all positions. Please review the statement below and sign to acknowledge your understanding and agreement.
        </p>
      </div>
      <DocumentEditor documentKey="alcohol-drug-agreement" formData={formData} setFormData={setFormData} onDocumentChange={onDocumentChange} />
      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
