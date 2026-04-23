import React from 'react';
import { ArrowRight, FileText, Shield, CheckSquare, Clock } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/e4e60e6f1_geolabs.png';

export default function StartStep({ onNext, requisition }) {
  return (
    <div className="max-w-xl mx-auto py-6">
      {/* Header */}
      <div className="text-center mb-10">
        <img src={LOGO_URL} alt="Geolabs" className="w-14 h-14 object-contain mx-auto mb-5" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {requisition ? `Apply — ${requisition.title}` : 'Employment Application'}
        </h2>
        {requisition ? (
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 rounded-full px-4 py-1.5 mt-1">
            <span>{requisition.department}</span>
            {requisition.office && <><span className="text-gray-300">·</span><span>{requisition.office}</span></>}
            {requisition.salaryMin && requisition.salaryMax && (
              <><span className="text-gray-300">·</span><span className="text-bronze font-medium">${Number(requisition.salaryMin).toLocaleString()}–${Number(requisition.salaryMax).toLocaleString()}/yr</span></>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Geolabs, Inc. · Waipahu, Hawaii</p>
        )}
      </div>

      {/* Steps overview */}
      <div className="space-y-2 mb-10">
        {[
          { icon: FileText, label: 'Complete your application', desc: 'Employment history, education, skills, and references' },
          { icon: Shield, label: 'Required legal disclosures', desc: 'EEO, disability, and veteran self-identification' },
          { icon: CheckSquare, label: 'Drug policy acknowledgment', desc: 'Review and sign the drug-free workplace policy' },
          { icon: CheckSquare, label: 'Review & submit', desc: 'Verify all information before final submission' },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
              <item.icon className="w-4 h-4 text-bronze" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">{item.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-8 py-3 bg-bronze hover:bg-bronze-dark text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          Begin Application
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Estimated time: 15–20 minutes
        </p>
      </div>
    </div>
  );
}