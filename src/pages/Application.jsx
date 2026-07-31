import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { appClient } from '@/api/localClient';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Cloud, Loader2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/app/Header';
import useSEO from '../hooks/useSEO';
import AppFooter from '../components/app/AppFooter';
import Stepper from '../components/app/Stepper';
import StepShell from '../components/app/StepShell';
import GroupedApplicationStep from '../components/app/GroupedApplicationStep';
import { INITIAL_FORM_DATA } from '../lib/initialFormData';
import { deleteResumeFile, getResumeFile, resumeRecordToAttachment } from '../lib/resumeStorage';
import { getSubmissionIssues } from '../lib/applicationValidation';

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
const FLOW_VERSION = 'simple-v3';
const FINAL_REVIEW_STEP = 6;

const mapV2Step = step => {
  const value = Number.isFinite(Number(step)) ? Number(step) : 0;
  if (value <= 3) return Math.max(value, 0);
  if (value === 4) return 5;
  return FINAL_REVIEW_STEP;
};

const mapLegacyStep = (step) => {
  const value = Number.isFinite(Number(step)) ? Number(step) : 0;
  if (value <= 0) return 0;
  if (value <= 3) return 1;
  if (value <= 6) return 2;
  if (value <= 10 || value === 14) return 3;
  if (value <= 13) return 5;
  if (value === 15) return 4;
  return FINAL_REVIEW_STEP;
};

const restoreStep = (step, version) => {
  if (version === FLOW_VERSION) {
    return Math.min(Math.max(Number(step) || 0, 0), FINAL_REVIEW_STEP);
  }
  if (version === 'simple-v2') return mapV2Step(step);
  return mapLegacyStep(step);
};

const restoreCompletedSteps = (steps, version) => (
  [...new Set((Array.isArray(steps) ? steps : []).map(step => restoreStep(step, version)))]
);

const readSavedFormData = (rawValue) => {
  if (!rawValue) return { data: null, savedAt: 0 };
  const parsed = JSON.parse(rawValue);
  const { _localSavedAt = 0, ...data } = parsed;
  return { data, savedAt: Number(_localSavedAt) || 0 };
};

const REQUIRED_FIELDS = [
  ['firstName', 'First name'],
  ['lastName', 'Last name'],
  ['email', 'Email address'],
  ['address', 'Street address'],
  ['city', 'City'],
  ['state', 'State'],
  ['zip', 'ZIP code'],
  ['positionAppliedFor', 'Position applied for'],
  ['preferredLocation', 'Preferred office location'],
  ['certifyInitials', 'Reference authorization initials'],
  ['medInitials', 'Medical-policy acknowledgment initials'],
  ['highestEducationLevel', 'Highest education level'],
];

export default function Application() {
  const { requisitionId } = useParams();

  useSEO(
    'Apply Now | Geolabs, Inc. Careers',
    'Submit your application to join the Geolabs, Inc. team. Complete our online employment application for geotechnical engineering and related positions in Hawaii.'
  );
  const storageKey = `geolabs_application_${requisitionId || 'general'}`;

  const [requisition, setRequisition] = useState(null);
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      return restoreStep(
        localStorage.getItem(`${storageKey}_step`) || '0',
        localStorage.getItem(`${storageKey}_flowVersion`),
      );
    } catch { return 0; }
  });
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      return restoreCompletedSteps(
        JSON.parse(localStorage.getItem(`${storageKey}_completed`) || '[]'),
        localStorage.getItem(`${storageKey}_flowVersion`),
      );
    } catch { return []; }
  });
  const [direction, setDirection] = useState(1);
  const [activeTasks, setActiveTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`${storageKey}_tasks`) || '{}');
    } catch { return {}; }
  });
  const [formData, setFormData] = useState(() => {
    try {
      const { data } = readSavedFormData(localStorage.getItem(storageKey));
      return data ? { ...INITIAL_FORM_DATA, ...data } : INITIAL_FORM_DATA;
    } catch { return INITIAL_FORM_DATA; }
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [fixingFromReview, setFixingFromReview] = useState(false);

  // Draft DB sync state
  const [draftId, setDraftId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
  const [draftRestored, setDraftRestored] = useState(false);
  const saveTimerRef = useRef(null);
  const saveStatusTimerRef = useRef(null);
  const isFirstRender = useRef(true);
  const applyingExternalUpdateRef = useRef(false);
  const latestLocalSaveRef = useRef((() => {
    try { return readSavedFormData(localStorage.getItem(storageKey)).savedAt; } catch { return 0; }
  })());

  const restoreSavedResume = useCallback(async (baseData = null) => {
    try {
      const record = await getResumeFile(storageKey);
      if (!record) {
        if (baseData?.resumeFileUrl) {
          return {
            ...baseData,
            resumeFileUrl: '',
            resumeFileName: '',
            resumeFileSize: 0,
            resumeAttachment: null,
          };
        }
        return baseData;
      }
      const attachment = await resumeRecordToAttachment(record);
      return {
        ...(baseData || {}),
        resumeFileUrl: `attached:${record.name}`,
        resumeFileName: record.name,
        resumeFileSize: record.size,
        resumeAttachment: attachment,
      };
    } catch (error) {
      console.error('Resume recovery failed:', error);
      return baseData;
    }
  }, [storageKey]);

  // Restore the actual resume file from IndexedDB on refresh or in a new tab.
  useEffect(() => {
    let active = true;
    restoreSavedResume(formData).then((restored) => {
      if (!active || !restored) return;
      const changed = restored.resumeAttachment !== formData.resumeAttachment
        || restored.resumeFileUrl !== formData.resumeFileUrl;
      if (changed) setFormData(restored);
    });
    return () => { active = false; };
  }, [storageKey]);

  // Load requisition
  useEffect(() => {
    if (requisitionId) {
      appClient.entities.JobRequisition.filter({ id: requisitionId }).then(([req]) => {
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
      appClient.entities.Application.filter({ id: draftParam, isDraft: true }).then(([draft]) => {
        if (draft?.applicationData) {
          setFormData({ ...INITIAL_FORM_DATA, ...draft.applicationData });
          setDraftId(draft.id);
          setCurrentStep(restoreStep(draft.applicationData._step || 0, draft.applicationData._flowVersion));
          setCompletedSteps(restoreCompletedSteps(draft.applicationData._completedSteps || [], draft.applicationData._flowVersion));
          setDraftRestored(true);
        }
      });
    } else {
      // Try to find existing draft by locally-stored draftId
      const storedDraftId = localStorage.getItem(`${storageKey}_draftId`);
      if (storedDraftId) {
        appClient.entities.Application.filter({ id: storedDraftId, isDraft: true }).then(([draft]) => {
          if (draft) {
            setDraftId(storedDraftId);
            // Draft exists — local data is up to date (already loaded from localStorage above)
          }
        });
      }
    }
  }, []);

  // Persist lightweight fields synchronously after every committed edit.
  useLayoutEffect(() => {
    if (applyingExternalUpdateRef.current) {
      applyingExternalUpdateRef.current = false;
      return;
    }
    try {
      const { resumeAttachment, ...persistableFormData } = formData;
      const savedAt = Date.now();
      latestLocalSaveRef.current = savedAt;
      localStorage.setItem(storageKey, JSON.stringify({ ...persistableFormData, _localSavedAt: savedAt }));
      setSaveStatus('saved');
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {}
  }, [formData, storageKey]);

  useLayoutEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_step`, String(currentStep));
      localStorage.setItem(`${storageKey}_completed`, JSON.stringify(completedSteps));
      localStorage.setItem(`${storageKey}_tasks`, JSON.stringify(activeTasks));
      localStorage.setItem(`${storageKey}_flowVersion`, FLOW_VERSION);
    } catch {}
  }, [currentStep, completedSteps, activeTasks, storageKey]);

  // Keep multiple open tabs synchronized to the newest saved draft.
  useEffect(() => {
    const handleStorage = async (event) => {
      if (event.storageArea !== localStorage) return;
      if (event.key === storageKey && event.newValue) {
        try {
          const { data, savedAt } = readSavedFormData(event.newValue);
          if (!data || savedAt <= latestLocalSaveRef.current) return;
          latestLocalSaveRef.current = savedAt;
          const restored = await restoreSavedResume({ ...INITIAL_FORM_DATA, ...data });
          applyingExternalUpdateRef.current = true;
          setFormData(restored || { ...INITIAL_FORM_DATA, ...data });
          setSaveStatus('saved');
          setDraftRestored(true);
        } catch {}
      }
      if (event.key === `${storageKey}_step` && event.newValue !== null) {
        setCurrentStep(restoreStep(event.newValue, FLOW_VERSION));
      }
      if (event.key === `${storageKey}_completed` && event.newValue) {
        try {
          setCompletedSteps(restoreCompletedSteps(JSON.parse(event.newValue), FLOW_VERSION));
        } catch {}
      }
      if (event.key === `${storageKey}_tasks` && event.newValue) {
        try {
          setActiveTasks(JSON.parse(event.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [restoreSavedResume, storageKey]);

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
      const { resumeAttachment, ...persistableFormData } = formData;
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
        applicationData: {
          ...persistableFormData,
          _step: currentStep,
          _completedSteps: completedSteps,
          _flowVersion: FLOW_VERSION,
        },
      };

      try {
        if (draftId) {
          await appClient.entities.Application.update(draftId, payload);
        } else {
          // Check if a draft already exists for this email + requisition
          const existing = await appClient.entities.Application.filter({
            email: formData.email,
            requisitionId: requisitionId || null,
            isDraft: true,
          });
          if (existing[0]) {
            await appClient.entities.Application.update(existing[0].id, payload);
            setDraftId(existing[0].id);
            localStorage.setItem(`${storageKey}_draftId`, existing[0].id);
          } else {
            const created = await appClient.entities.Application.create(payload);
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
      localStorage.removeItem(`${storageKey}_tasks`);
      localStorage.removeItem(`${storageKey}_flowVersion`);
      localStorage.removeItem(`${storageKey}_draftId`);
      deleteResumeFile(storageKey).catch(() => {});
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

  const goFixReviewItem = useCallback((step, task = 0) => {
    setFixingFromReview(true);
    setActiveTasks(previous => ({ ...previous, [step]: task }));
    goToStep(step);
  }, [goToStep]);

  const returnToReview = useCallback(() => {
    setFixingFromReview(false);
    goToStep(FINAL_REVIEW_STEP);
  }, [goToStep]);

  const handleSubmit = async () => {
    let submissionResumeAttachment = formData.resumeAttachment;
    if (formData.resumeFileUrl && !submissionResumeAttachment) {
      const storedResume = await getResumeFile(storageKey).catch(() => null);
      if (!storedResume) {
        throw new Error('Your saved resume could not be recovered. Please attach it again before submitting.');
      }
      submissionResumeAttachment = await resumeRecordToAttachment(storedResume);
    }
    const submissionIssues = getSubmissionIssues(formData, REQUIRED_FIELDS);
    if (submissionIssues.length) {
      throw new Error(`Complete these required items before submitting: ${submissionIssues.map(item => item.label).join('; ')}.`);
    }

    const now = new Date().toISOString();
    setCompletedSteps(prev => prev.includes(currentStep) ? prev : [...prev, currentStep]);

    const eeoData = {
      gender: formData.eeoGender,
      race: formData.eeoRace,
      disabilityStatus: formData.disabilityStatus,
      veteranStatus: formData.veteranStatus,
    };

    const {
      eeoGender, eeoRace, disabilityStatus, veteranStatus,
      resumeAttachment, resumeParsedPreview, ...appDataClean
    } = formData;

    const applicationId = draftId || crypto.randomUUID();

    const finalPayload = {
      id: applicationId,
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

    const deliveryResponse = await fetch('/api/submit-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...finalPayload,
        resumeAttachment: submissionResumeAttachment,
      }),
    });
    const deliveryResult = await deliveryResponse.json().catch(() => ({}));
    if (!deliveryResponse.ok) {
      throw new Error(deliveryResult.error || 'We could not deliver your application to HR. Please try again.');
    }

    let record;
    if (draftId) {
      // Convert draft to final submission
      record = await appClient.entities.Application.update(draftId, finalPayload);
    } else {
      record = await appClient.entities.Application.create(finalPayload);
    }

    clearDraft();
    setSubmittedId(applicationId);
    setConfirmationSent(Boolean(deliveryResult.confirmationSent));
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stepProps = { formData, setFormData, onNext: goNext, onBack: goBack };
  const activeTask = activeTasks[currentStep] || 0;
  const submissionIssues = getSubmissionIssues(formData, REQUIRED_FIELDS);
  const setActiveTask = taskIndex => {
    setActiveTasks(previous => ({ ...previous, [currentStep]: taskIndex }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StartStep onNext={goNext} requisition={requisition} />;
      case 1: return (
        <GroupedApplicationStep onBack={goBack} onNext={goNext} stepIndex={1} activeTask={activeTask} onTaskChange={setActiveTask}>
          <ResumeStep {...stepProps} resumeStorageKey={storageKey} />
          <ApplicationInfoStep {...stepProps} requisition={requisition} />
          <GeneralInfoStep {...stepProps} />
        </GroupedApplicationStep>
      );
      case 2: return (
        <GroupedApplicationStep onBack={goBack} onNext={goNext} stepIndex={2} activeTask={activeTask} onTaskChange={setActiveTask}>
          <EmploymentStep {...stepProps} />
          <EducationStep {...stepProps} />
          <SkillsStep {...stepProps} />
        </GroupedApplicationStep>
      );
      case 3: return (
        <GroupedApplicationStep onBack={goBack} onNext={goNext} stepIndex={3} activeTask={activeTask} onTaskChange={setActiveTask}>
          <ReferencesStep {...stepProps} />
          <MedicalStep {...stepProps} />
          <AffiliationsStep {...stepProps} />
          <CertificationStep {...stepProps} />
        </GroupedApplicationStep>
      );
      case 4: return <AlcoholDrugStep {...stepProps} />;
      case 5: return (
        <GroupedApplicationStep onBack={goBack} onNext={goNext} stepIndex={5} activeTask={activeTask} onTaskChange={setActiveTask}>
          <EEOStep {...stepProps} />
          <DisabilityStep {...stepProps} />
          <VeteranStep {...stepProps} />
        </GroupedApplicationStep>
      );
      case 6: return <ReviewStep formData={formData} onBack={goBack} onSubmit={handleSubmit} onNavigate={goFixReviewItem} requiredFields={REQUIRED_FIELDS} />;
      default: return null;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-2xl mx-auto px-2 py-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 p-4 sm:p-5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 100 }}
              className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-[#A65F2A]/10 border border-[#A65F2A]/20 rounded-lg px-4 py-1.5 mb-4"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#A65F2A]" />
              <span className="text-xs font-bold text-[#8A4A22] tracking-widest uppercase">Application Received</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="text-3xl font-bold text-gray-900 mb-3 tracking-tight"
            >
              You're in the pipeline!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-sm text-gray-600 leading-relaxed mb-6"
            >
              Thank you, <strong className="text-gray-900">{formData.firstName}</strong>. Your application for <strong className="text-[#A65F2A]">{requisition?.title || formData.positionAppliedFor || 'this position'}</strong> has been received and our team will review it shortly.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-8 text-left"
            >
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Confirmation details</div>
              <div className="text-xs text-gray-600">
                {confirmationSent ? 'Confirmation sent to:' : 'Applicant email:'}{' '}
                <strong className="text-gray-900">{formData.email}</strong>
              </div>
              <div className="text-xs text-gray-500 mt-1">Application ID: <code className="font-mono text-[#A65F2A] text-[11px]">{submittedId}</code></div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold bg-[#A65F2A] hover:bg-[#8A4A22] text-white transition-colors"
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
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* Draft restored banner */}
          {draftRestored && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-5 py-3"
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
          {requisition && currentStep > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-5 py-3 shadow-sm"
            >
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-900">{requisition.title}</div>
                <div className="text-[11px] text-gray-600">{requisition.department} · {requisition.office || 'Geolabs, Inc.'}</div>
              </div>
              {/* Auto-save indicator */}
              {currentStep > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 text-[10px] text-gray-500"
                >
                  {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
                  {saveStatus === 'saved' && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.3 }}><Cloud className="w-3 h-3 text-green-600" /> Saved</motion.div>}
                  {saveStatus === 'idle' && <><Cloud className="w-3 h-3 text-green-600" /> Saved on this device</>}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Auto-save indicator when no requisition banner */}
          {!requisition && currentStep > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end"
            >
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
                {saveStatus === 'saved' && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.3 }}><Cloud className="w-3 h-3 text-green-600" /> Saved</motion.div>}
                {saveStatus === 'idle' && <><Cloud className="w-3 h-3 text-green-600" /> Saved on this device</>}
              </div>
            </motion.div>
          )}

          {fixingFromReview && currentStep !== FINAL_REVIEW_STEP && (
            <div className="flex flex-col gap-2 rounded-lg border border-[#A65F2A]/25 bg-[#F8F0E9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Updating your application</p>
                <p className="text-[11px] text-slate-600">Your progress is saved. Return to the final review whenever you’re ready.</p>
              </div>
              <button
                type="button"
                onClick={returnToReview}
                className="flex-shrink-0 rounded-lg bg-[#A65F2A] px-3 py-2 text-xs font-bold text-white hover:bg-[#8A4A22]"
              >
                Return to final review
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden bg-white">
            {currentStep > 0 && (
              <motion.div
                className="px-4 sm:px-6 pt-5 pb-4 border-b border-slate-200 bg-slate-50/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Stepper
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  onStepClick={goToStep}
                  activeTask={activeTask}
                  onTaskClick={setActiveTask}
                  reviewHasBlockers={submissionIssues.length > 0}
                />
              </motion.div>
            )}
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <StepShell stepKey={currentStep} direction={direction}>
                {renderStep()}
              </StepShell>
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
