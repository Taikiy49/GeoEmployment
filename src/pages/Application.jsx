import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Cloud, Loader2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/app/Header';
import useSEO from '../hooks/useSEO';
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

const SAVE_DEBOUNCE_MS = 2500;

export default function Application() {
  const { requisitionId } = useParams();

  useSEO(
    'Apply Now | Geolabs, Inc. Careers',
    'Submit your application to join the Geolabs team. Complete our online employment application for geotechnical engineering and related positions in Hawaii.'
  );
  const storageKey = `geolabs_application_${requisitionId || 'general'}`;

  const [requisition, setRequisition] = useState(null);
  const [currentStep, setCurrentStep] = useState(() => {
    try { return parseInt(localStorage.getItem(`${storageKey}_step`) || '0', 10); } catch { return 0; }
  });
  const [completedSteps, setCompletedSteps] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${storageKey}_completed`) || '[]'); } catch { return []; }
  });
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...INITIAL_FORM_DATA, ...JSON.parse(saved) } : INITIAL_FORM_DATA;
    } catch { return INITIAL_FORM_DATA; }
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);

  // Draft DB sync state
  const [draftId, setDraftId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
  const [draftRestored, setDraftRestored] = useState(false);
  const saveTimerRef = useRef(null);
  const isFirstRender = useRef(true);

  // Load requisition
  useEffect(() => {
    if (requisitionId) {
      base44.entities.JobRequisition.filter({ id: requisitionId }).then(([req]) => {
        if (req) {
          setRequisition(req);
          setFormData(prev => ({
            ...prev,
            positionAppliedFor: prev.positionAppliedFor || req.title,
            preferredLocation: prev.preferredLocation || req.office || '',
          }));
        }
      });
    }
  }, [requisitionId]);

  // On mount: check URL for ?draft=id, or look up draft by email if already stored locally
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const draftParam = urlParams.get('draft');

    if (draftParam) {
      // Restore from DB draft ID in URL
      base44.entities.Application.filter({ id: draftParam, isDraft: true }).then(([draft]) => {
        if (draft?.applicationData) {
          setFormData({ ...INITIAL_FORM_DATA, ...draft.applicationData });
          setDraftId(draft.id);
          setCurrentStep(draft.applicationData._step || 0);
          setCompletedSteps(draft.applicationData._completedSteps || []);
          setDraftRestored(true);
        }
      });
    } else {
      // Try to find existing draft by locally-stored draftId
      const storedDraftId = localStorage.getItem(`${storageKey}_draftId`);
      if (storedDraftId) {
        base44.entities.Application.filter({ id: storedDraftId, isDraft: true }).then(([draft]) => {
          if (draft) {
            setDraftId(storedDraftId);
            // Draft exists — local data is up to date (already loaded from localStorage above)
          }
        });
      }
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(formData)); } catch {}
  }, [formData, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_step`, String(currentStep));
      localStorage.setItem(`${storageKey}_completed`, JSON.stringify(completedSteps));
    } catch {}
  }, [currentStep, completedSteps, storageKey]);

  // Auto-save to DB (debounced) — only when email is present
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!formData.email || currentStep === 0) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');

    saveTimerRef.current = setTimeout(async () => {
      const payload = {
        requisitionId: requisitionId || null,
        requisitionTitle: requisition?.title || formData.positionAppliedFor || '',
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        email: formData.email,
        phone: formData.phone || formData.cell || '',
        positionAppliedFor: formData.positionAppliedFor || '',
        resumeFileUrl: formData.resumeFileUrl || '',
        isDraft: true,
        draftSavedAt: new Date().toISOString(),
        applicationData: { ...formData, _step: currentStep, _completedSteps: completedSteps },
      };

      try {
        if (draftId) {
          await base44.entities.Application.update(draftId, payload);
        } else {
          // Check if a draft already exists for this email + requisition
          const existing = await base44.entities.Application.filter({
            email: formData.email,
            requisitionId: requisitionId || null,
            isDraft: true,
          });
          if (existing[0]) {
            await base44.entities.Application.update(existing[0].id, payload);
            setDraftId(existing[0].id);
            localStorage.setItem(`${storageKey}_draftId`, existing[0].id);
          } else {
            const created = await base44.entities.Application.create(payload);
            setDraftId(created.id);
            localStorage.setItem(`${storageKey}_draftId`, created.id);
          }
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(saveTimerRef.current);
  }, [formData, currentStep, completedSteps]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}_step`);
      localStorage.removeItem(`${storageKey}_completed`);
      localStorage.removeItem(`${storageKey}_draftId`);
    } catch {}
  };

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

    const eeoData = {
      gender: formData.eeoGender,
      race: formData.eeoRace,
      disabilityStatus: formData.disabilityStatus,
      veteranStatus: formData.veteranStatus,
    };

    const { eeoGender, eeoRace, disabilityStatus, veteranStatus, ...appDataClean } = formData;

    const finalPayload = {
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
      stageHistory: [{ stage: 'applied', changedAt: now, changedBy: 'applicant', note: 'Application submitted' }],
      auditTrail: [{ action: 'Application submitted', performedBy: formData.email, performedAt: now, details: 'Initial submission via applicant portal' }],
      source: 'applicant_portal',
    };

    let record;
    if (draftId) {
      // Convert draft to final submission
      record = await base44.entities.Application.update(draftId, finalPayload);
    } else {
      record = await base44.entities.Application.create(finalPayload);
    }

    clearDraft();
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
      <div className="min-h-screen bg-[#FFFFFF]">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-gradient-to-br from-white to-[#F5F7FA] rounded-2xl border border-[#DAE0E7] shadow-lg p-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 100 }}
              className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </motion.div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-2xl font-bold text-[#21242C] mb-2"
            >
              Application Submitted!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-sm text-[#737B8C] leading-relaxed mb-5"
            >
              Thank you, <strong>{formData.firstName}</strong>. Your application for <strong>{requisition?.title || formData.positionAppliedFor || 'this position'}</strong> has been received and is being reviewed.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-xs text-[#737B8C] mb-8"
            >
              Confirmation sent to <strong>{formData.email}</strong>. Your application ID: <code className="bg-[#F3F5F7] px-2 py-1 rounded text-[11px] font-mono">{submittedId}</code>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-[#EFB506] hover:text-[#D99E04] transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> View All Open Positions
              </Link>
            </motion.div>
          </motion.div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <Header />
      <main className="w-full px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* Draft restored banner */}
          {draftRestored && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3"
            >
              <motion.div animate={{ rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <RotateCcw className="w-4 h-4 text-blue-600 flex-shrink-0" />
              </motion.div>
              <p className="text-xs text-blue-700 flex-1">
                <strong>Your progress has been restored.</strong> Pick up right where you left off.
              </p>
              <button onClick={() => setDraftRestored(false)} className="text-blue-400 hover:text-blue-600 text-lg leading-none transition-colors">×</button>
            </motion.div>
          )}

          {/* Job context banner */}
          {requisition && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 bg-white rounded-xl border border-[#DAE0E7] px-5 py-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EFB506]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">💼</span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-[#21242C]">Applying for: {requisition.title}</div>
                <div className="text-[11px] text-[#737B8C]">{requisition.department} · {requisition.office || 'Geolabs, Inc.'}</div>
              </div>
              {/* Auto-save indicator */}
              {currentStep > 0 && formData.email && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 text-[10px] text-[#737B8C]"
                >
                  {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
                  {saveStatus === 'saved' && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.3 }}><Cloud className="w-3 h-3 text-emerald-500" /> Saved</motion.div>}
                  {saveStatus === 'idle' && draftId && <><Cloud className="w-3 h-3 text-[#DAE0E7]" /> Auto-saved</>}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Auto-save indicator when no requisition banner */}
          {!requisition && currentStep > 0 && formData.email && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end"
            >
              <div className="flex items-center gap-1.5 text-[10px] text-[#737B8C]">
                {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
                {saveStatus === 'saved' && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.3 }}><Cloud className="w-3 h-3 text-emerald-500" /> Saved</motion.div>}
                {saveStatus === 'idle' && draftId && <><Cloud className="w-3 h-3 text-[#DAE0E7]" /> Auto-saved</>}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-[#DAE0E7] shadow-sm overflow-hidden bg-white hover:shadow-md transition-shadow"
          >
            {currentStep > 0 && (
              <motion.div
                className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#DAE0E7]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Stepper currentStep={currentStep} completedSteps={completedSteps} onStepClick={goToStep} />
              </motion.div>
            )}
            <div className="px-6 sm:px-8 py-8">
              <StepShell stepKey={currentStep} direction={direction}>
                {renderStep()}
              </StepShell>
            </div>
          </motion.div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}