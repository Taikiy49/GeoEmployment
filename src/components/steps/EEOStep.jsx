import React from 'react';
import NavigationButtons from '../app/NavigationButtons';
import DocumentEditor from '../app/DocumentEditor';

export default function EEOStep({ formData, setFormData, onNext, onBack, onDocumentChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">EEO Voluntary Self-Identification Survey</h2>
        <p className="mt-1 text-sm text-brand-muted">
          This information is collected for federal EEO-1 reporting purposes only. It is voluntary and will not affect your opportunity for employment.
          You may leave any question unanswered.
        </p>
      </div>
      <DocumentEditor documentKey="eeo-survey" formData={formData} setFormData={setFormData} onDocumentChange={onDocumentChange} />
      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
