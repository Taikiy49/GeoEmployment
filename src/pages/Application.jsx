import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import Header from '../components/app/Header';
import AppFooter from '../components/app/AppFooter';
import Stepper from '../components/app/Stepper';
import StepShell from '../components/app/StepShell';
import { INITIAL_FORM_DATA } from '../lib/initialFormData';

// Step imports
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
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

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
    setCompletedSteps(prev => prev.includes(currentStep) ? prev : [...prev, currentStep]);
    await base44.entities.Application.create({
      status: 'submitted',
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || formData.cell,
      positionAppliedFor: formData.positionAppliedFor,
      preferredLocation: formData.preferredLocation,
      applicationData: formData,
      resumeFileUrl: formData.resumeFileUrl,
    });
  };

  const stepProps = {
    formData,
    setFormData,
    onNext: goNext,
    onBack: goBack,
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StartStep onNext={goNext} />;
      case 1: return <ResumeStep {...stepProps} />;
      case 2: return <ApplicationInfoStep {...stepProps} />;
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

  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(ellipse at 15% 10%, rgba(184, 115, 51, 0.08) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 15%, rgba(253, 247, 241, 0.6) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 80%, rgba(246, 236, 226, 0.3) 0%, transparent 60%),
          #fbf7ea
        `,
      }}
    >
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Application shell */}
        <div
          className="rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Stepper */}
          {currentStep > 0 && (
            <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-[#e5e7eb]">
              <Stepper
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={goToStep}
              />
            </div>
          )}

          {/* Step content */}
          <div className="px-5 sm:px-7 py-5 sm:py-6">
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