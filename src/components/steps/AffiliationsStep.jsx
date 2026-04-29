import React from 'react';
import FormSection from '../app/FormSection';
import NavigationButtons from '../app/NavigationButtons';

export default function AffiliationsStep({ formData, setFormData, onNext, onBack }) {
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const value = formData.affiliations || '';
  const maxRecommended = 800;

  return (
    <div>
      <FormSection
        title="Professional Affiliations"
        description="This section is optional. List any memberships, licenses, or professional organizations relevant to your work. If none apply, you may enter 'N/A'."
      >
        <div className="space-y-5">

          {/* Examples card */}
          <div className="bg-[#FEF8E7] border border-[#F5C400]/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-[#b8910a] mb-2 uppercase tracking-wide">Helpful examples you can include</p>
            <ul className="space-y-1">
              {[
                'ASCE Member (since 2022)',
                'ACI Concrete Field Testing Technician – Grade I',
                'Engineer-in-Training (EIT), State of Hawaii',
                'OSHA 30-Hour Construction Safety',
              ].map((ex, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-[#374151]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5C400] flex-shrink-0" />
                  {ex}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-gray-400 mt-2">
              You may also list relevant trade unions, technical societies, or other professional licenses and certifications.
            </p>
          </div>

          {/* Main textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                Professional Affiliations, Licenses & Memberships
              </label>
              <span className="text-[10px] text-gray-400">You may write in bullet form.</span>
            </div>
            <textarea
              rows={6}
              value={value}
              onChange={e => update('affiliations', e.target.value)}
              placeholder={`Examples:\n• ASCE Member (since 2022)\n• ACI Concrete Field Testing Technician – Grade I\n• Engineer-in-Training (EIT), State of Hawaii\n• OSHA 30-Hour Construction Safety\n\nIf none, type: N/A`}
              className="w-full px-3 py-2.5 text-sm border border-[#e5e7eb] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze"
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400">Focus on credentials and memberships that support your application for this role.</p>
              <span className={`text-[10px] ${value.length > maxRecommended ? 'text-amber-500' : 'text-gray-400'}`}>
                {value.length} / {maxRecommended} recommended
              </span>
            </div>
          </div>

        </div>
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}