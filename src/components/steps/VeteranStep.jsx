import React from 'react';
import NavigationButtons from '../app/NavigationButtons';
import DocumentEditor from '../app/DocumentEditor';

export default function VeteranStep({ formData, setFormData, onNext, onBack, onDocumentChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Affirmative Action: Invitation to Self-Identify as a Protected Veteran (VEVRAA)</h2>
        <p className="mt-1 text-sm text-brand-muted">
          This information is collected for affirmative action reporting only. Your decision to self-identify is voluntary and will not affect your application or employment.
          You may leave this form unanswered.
        </p>
      </div>
      <DocumentEditor documentKey="veteran-status" formData={formData} setFormData={setFormData} onDocumentChange={onDocumentChange} />
      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
