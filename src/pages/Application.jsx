import React, { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import Header from '../components/app/Header';
import AppFooter from '../components/app/AppFooter';
import Stepper from '../components/app/Stepper';
import StepShell from '../components/app/StepShell';
import { INITIAL_FORM_DATA } from '../lib/initialFormData';

import StartStep from '../components/steps/StartStep';
import ResumeStep from '../components/steps/ResumeStep';
import ApplicationInfoStep from '../components/steps/ApplicationInfoStep';
import GeneralInfoStep from '../components/steps/GeneralInfoStep';
import EmploymentStep from '../components/steps/EmploymentStep';
import EducationStep from '../components/steps/EducationStep';
import SkillsStep from '../components/steps/SkillsStep';
import ReferencesStep from '../components/steps/ReferencesStep';
import MedicalStep from '../components/steps/MedicalStep';
import AffiliationsStep from '../components/steps/AffiliationsStep';
import CertificationStep from '../components/steps/CertificationStep';
import EEOStep from '../components/steps/EEOStep';
import DisabilityStep from '../components/steps/DisabilityStep';
import VeteranStep from '../components/steps/VeteranStep';
import AlcoholDrugStep from '../components/steps/AlcoholDrugStep';
import ReviewStep from '../components/steps/ReviewStep';

export default function Application() {
  const { requisitionId } = useParams();
  const [requisition, setRequisition] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);

  useEffect(() => {
    if (requisitionId) {
      base44.entities.JobRequisition.filter({ id: requisitionId }).then(([req]) => {
        if (req) {
          setRequisition(req);
          setFormData(prev => ({
            ...prev,
            positionAppliedFor: req.title,
            preferredLocation: req.office || '',
          }));
        }
      });
    }
  }, [requisitionId]);

  const goToStep = useCallback((step) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const goNext = useCallback(() => {
    setCompletedSteps(prev => prev.includes(currentStep) ? prev : [...prev, currentStep]);
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const goBack = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const handleSubmit = async () => {
    const now = new Date().toISOString();
    setCompletedSteps(prev => prev.includes(currentStep) ? prev : [...prev, currentStep]);

    // Separate EEO data from main form
    const eeoData = {
      gender: formData.eeoGender,
      race: formData.eeoRace,
      disabilityStatus: formData.disabilityStatus,
      veteranStatus: formData.veteranStatus,
    };

    // Strip EEO from applicationData for recruiter-facing record
    const { eeoGender, eeoRace, disabilityStatus, veteranStatus, ...appDataClean } = formData;

    const record = await base44.entities.Application.create({
      requisitionId: requisitionId || null,
      requisitionTitle: requisition?.title || formData.positionAppliedFor || '',
      stage: 'applied',
      status: 'active',
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || formData.cell,
      positionAppliedFor: formData.positionAppliedFor,
      preferredLocation: formData.preferredLocation,
      applicationData: appDataClean,
      resumeFileUrl: formData.resumeFileUrl,
      submittedAt: now,
      isDraft: false,
      eeoData,
      stageHistory: [{
        stage: 'applied',
        changedAt: now,
        changedBy: 'applicant',
        note: 'Application submitted',
      }],
      auditTrail: [{
        action: 'Application submitted',
        performedBy: formData.email,
        performedAt: now,
        details: 'Initial submission via applicant portal',
      }],
      source: 'applicant_portal',
    });

    setSubmittedId(record.id);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stepProps = { formData, setFormData, onNext: goNext, onBack: goBack };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StartStep onNext={goNext} requisition={requisition} />;
      case 1: return <ResumeStep {...stepProps} />;
      case 2: return <ApplicationInfoStep {...stepProps} requisition={requisition} />;
      case 3: return <GeneralInfoStep {...stepProps} />;
      case 4: return <EmploymentStep {...stepProps} />;
      case 5: return <EducationStep {...stepProps} />;
      case 6: return <SkillsStep {...stepProps} />;
      case 7: return <ReferencesStep {...stepProps} />;
      case 8: return <MedicalStep {...stepProps} />;
      case 9: return <AffiliationsStep {...stepProps} />;
      case 10: return <CertificationStep {...stepProps} />;
      case 11: return <EEOStep {...stepProps} />;
      case 12: return <DisabilityStep {...stepProps} />;
      case 13: return <VeteranStep {...stepProps} />;
      case 14: return <AlcoholDrugStep {...stepProps} />;
      case 15: return <ReviewStep formData={formData} onBack={goBack} onSubmit={handleSubmit} />;
      default: return null;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen" style={{ background: '#fbf7ea' }}>
        <Header />
        <main className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-10">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-navy mb-2">Application Submitted!</h1>
            <p className="text-sm text-[#6b7280] leading-relaxed mb-4">
              Thank you, <strong>{formData.firstName}</strong>. Your application for <strong>{requisition?.title || formData.positionAppliedFor || 'this position'}</strong> has been received and is being reviewed.
            </p>
            <p className="text-xs text-[#9ca3af] mb-6">
              Confirmation sent to <strong>{formData.email}</strong>. Your application ID: <code className="bg-[#f3f4f6] px-1.5 py-0.5 rounded text-[10px]">{submittedId}</code>
            </p>
            <div className="flex flex-col gap-2">
              <Link to="/" className="inline-flex items-center justify-center gap-1.5 text-sm text-bronze hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> View All Open Positions
              </Link>
            </div>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Job context banner */}
        {requisition && (
          <div className="mb-4 flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-5 py-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-bronze/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">💼</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-900">Applying for: {requisition.title}</div>
              <div className="text-[11px] text-gray-400">{requisition.department} · {requisition.office || 'Geolabs, Inc.'}</div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
          {currentStep > 0 && (
            <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-gray-100">
              <Stepper currentStep={currentStep} completedSteps={completedSteps} onStepClick={goToStep} />
            </div>
          )}
          <div className="px-6 sm:px-8 py-7">
            <StepShell stepKey={currentStep} direction={direction}>
              {renderStep()}
            </StepShell>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}