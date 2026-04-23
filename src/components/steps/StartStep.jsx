import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Briefcase, FileText, Shield, Clock } from 'lucide-react';

export default function StartStep({ onNext, requisition }) {
  return (
    <div className="text-center max-w-2xl mx-auto py-8">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bronze to-bronze-dark flex items-center justify-center mx-auto mb-6 shadow-lg">
        <Briefcase className="w-8 h-8 text-white" />
      </div>

      <h2 className="text-2xl font-bold text-[#111827] mb-2">
        {requisition ? `Apply: ${requisition.title}` : 'Welcome to Geolabs, Inc.'}
      </h2>
      <p className="text-sm text-[#6b7280] mb-4 leading-relaxed max-w-md mx-auto">
        Thank you for your interest in employment with Geolabs. This application will guide you through the required steps to complete your submission.
      </p>
      {requisition && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bronze-soft border border-bronze-border text-xs text-bronze-dark font-medium mb-6">
          {requisition.department} · {requisition.office || 'Geolabs, Inc.'}
          {requisition.salaryMin && requisition.salaryMax && ` · $${Number(requisition.salaryMin).toLocaleString()}–$${Number(requisition.salaryMax).toLocaleString()}/yr`}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 mt-2">
        {[
          { icon: FileText, title: 'Complete Application', desc: 'Fill out your employment history, education, and skills' },
          { icon: Shield, title: 'Required Disclosures', desc: 'Self-identification and compliance acknowledgments' },
          { icon: Clock, title: 'Review & Submit', desc: 'Verify your information and submit securely' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e5e7eb] p-4 text-left">
            <div className="w-9 h-9 rounded-lg bg-bronze-soft flex items-center justify-center mb-3">
              <item.icon className="w-4 h-4 text-bronze" />
            </div>
            <h4 className="text-xs font-semibold text-[#111827] mb-1">{item.title}</h4>
            <p className="text-[10px] text-[#6b7280] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <Button
        onClick={onNext}
        className="rounded-full px-8 h-11 text-sm bg-bronze hover:bg-bronze-dark text-white border border-bronze-dark shadow-lg"
      >
        Apply Now
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      <p className="text-[10px] text-[#9ca3af] mt-4">
        Estimated completion time: 15–20 minutes
      </p>
    </div>
  );
}