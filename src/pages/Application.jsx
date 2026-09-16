import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { appClient } from '@/api/localClient';
import { useParams } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Cloud, Loader2, Mail, RotateCcw, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/app/Header';
import useSEO from '../hooks/useSEO';
import AppFooter from '../components/app/AppFooter';
import Stepper from '../components/app/Stepper';
import StepShell from '../components/app/StepShell';
import AccessibilityToolbar from '../components/app/AccessibilityToolbar';
import GroupedApplicationStep from '../components/app/GroupedApplicationStep';
import { INITIAL_FORM_DATA } from '../lib/initialFormData';
import { deleteResumeFile, getResumeFile, resumeRecordToAttachment, saveResumeFile } from '../lib/resumeStorage';
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
import VeteranStep from '../components/steps/VeteranStep';
import AlcoholDrugStep from '../components/steps/AlcoholDrugStep';
import ReviewStep from '../components/steps/ReviewStep';

function scrollToApplicationTop() {
  const instant = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 639px)').matches;
  window.scrollTo({ top: 0, behavior: instant ? 'instant' : 'smooth' });
}

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

const normalizeEducationEntries = data => {
  const blank = () => ({ institution: '', location: '', degree: '', field: '', yearCompleted: '' });
  const entries = (Array.isArray(data?.education) ? data.education : [])
    .filter((item, index) => index < 2 || Object.values(item || {}).some(value => String(value || '').trim()));
  while (entries.length < 2) entries.push(blank());
  return { ...data, education: entries };
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
  ['fcrInitials', 'FCRA disclosure initials'],
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
  const [activeTasks, setActiveTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`${storageKey}_tasks`) || '{}');
    } catch { return {}; }
  });
  const [formData, setFormData] = useState(() => {
    try {
      const { data } = readSavedFormData(localStorage.getItem(storageKey));
      return data ? normalizeEducationEntries({ ...INITIAL_FORM_DATA, ...data }) : INITIAL_FORM_DATA;
    } catch { return INITIAL_FORM_DATA; }
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [fixingFromReview, setFixingFromReview] = useState(false);

  // Private cross-device draft state
  const [resumeToken, setResumeToken] = useState(() => {
    try { return localStorage.getItem(`${storageKey}_resumeToken`) || ''; } catch { return ''; }
  });
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
  const [draftRestored, setDraftRestored] = useState(false);
  const [resumeLinkOpen, setResumeLinkOpen] = useState(false);
  const [resumeLinkEmail, setResumeLinkEmail] = useState('');
  const [resumeLinkStatus, setResumeLinkStatus] = useState('idle');
  const [resumeLinkError, setResumeLinkError] = useState('');
  const resumeDialogRef = useRef(null);
  const applicationSurfaceRef = useRef(null);
  useLayoutEffect(() => {
    if (!submitted) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [submitted]);
  const submissionIdRef = useRef('');
  const saveTimerRef = useRef(null);
  const saveStatusTimerRef = useRef(null);
  const isFirstRender = useRef(true);
  const applyingExternalUpdateRef = useRef(false);
  const serverResumeSignatureRef = useRef('');
  const latestLocalSaveRef = useRef((() => {
    try { return readSavedFormData(localStorage.getItem(storageKey)).savedAt; } catch { return 0; }
  })());

  useEffect(() => {
    if (!resumeLinkOpen) return;
    const trigger = document.activeElement;
    const dialog = resumeDialogRef.current;
    const surface = applicationSurfaceRef.current;
    const previousOverflow = document.body.style.overflow;
    if (surface) surface.inert = true;
    document.body.style.overflow = 'hidden';
    const getControls = () => [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]')];
    (dialog.querySelector('input') || getControls()[0])?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setResumeLinkOpen(false);
      }
      if (event.key === 'Tab') {
        const controls = getControls();
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    dialog.addEventListener('keydown', onKeyDown);
    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
      if (surface) surface.inert = false;
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [resumeLinkOpen]);

  useEffect(() => {
    if (resumeLinkOpen && resumeLinkStatus === 'sent') {
      resumeDialogRef.current?.querySelector('[data-continue-done]')?.focus();
    }
  }, [resumeLinkOpen, resumeLinkStatus]);

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
    } else {
      setFormData(prev => ({
        ...prev,
        positionAppliedFor: prev.positionAppliedFor || 'General Application',
      }));
    }
  }, [requisitionId]);

  const draftPayload = useCallback((attachment = null) => {
    const { resumeAttachment: _resumeAttachment, resumeParsedPreview: _preview, ...persistableFormData } = formData;
    return {
      requisitionId: requisitionId || null,
      requisitionTitle: requisition?.title || formData.positionAppliedFor || '',
      email: String(formData.email || resumeLinkEmail || '').trim(),
      formData: persistableFormData,
      currentStep,
      completedSteps,
      activeTasks,
      flowVersion: FLOW_VERSION,
      savedAt: new Date().toISOString(),
      ...(attachment ? { resumeAttachment: attachment } : {}),
    };
  }, [formData, requisitionId, requisition, currentStep, completedSteps, activeTasks, resumeLinkEmail]);

  const attachmentToFile = attachment => {
    const binary = atob(attachment.content);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new File([bytes], attachment.filename, { type: attachment.type || 'application/octet-stream', lastModified: Date.now() });
  };

  // Restore a private server draft when a continue link is opened.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('resume');
    if (!token) return;
    let active = true;
    fetch(`/api/application-drafts/resume?token=${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } })
      .then(async response => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'This private link could not be opened.');
        return result.draft;
      })
      .then(async draft => {
        if (!active || !draft?.formData) return;
        let attachment = draft.resumeAttachment || null;
        if (attachment?.content && attachment?.filename) {
          const file = attachmentToFile(attachment);
          await saveResumeFile(storageKey, file);
          serverResumeSignatureRef.current = `${attachment.filename}:${attachment.content.length}`;
        }
        const restored = normalizeEducationEntries({
          ...INITIAL_FORM_DATA,
          ...draft.formData,
          ...(attachment ? {
            resumeAttachment: attachment,
            resumeFileUrl: `attached:${attachment.filename}`,
            resumeFileName: attachment.filename,
            resumeFileSize: Math.round((attachment.content.length * 3) / 4),
          } : {}),
        });
        applyingExternalUpdateRef.current = true;
        setFormData(restored);
        setCurrentStep(restoreStep(draft.currentStep || 1, draft.flowVersion));
        setCompletedSteps(restoreCompletedSteps(draft.completedSteps || [], draft.flowVersion));
        setActiveTasks(draft.activeTasks || {});
        setResumeToken(token);
        localStorage.setItem(`${storageKey}_resumeToken`, token);
        setDraftRestored(true);
        urlParams.delete('resume');
        const cleaned = `${window.location.pathname}${urlParams.size ? `?${urlParams}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', cleaned);
      })
      .catch(error => {
        if (!active) return;
        setResumeLinkError(error.message);
        setResumeLinkOpen(true);
        urlParams.delete('resume');
        window.history.replaceState({}, '', `${window.location.pathname}${urlParams.size ? `?${urlParams}` : ''}`);
      });
    return () => { active = false; };
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

  // Once a private link exists, keep the encrypted-token draft current on the server.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!resumeToken || !formData.email || currentStep === 0) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');

    saveTimerRef.current = setTimeout(async () => {
      try {
        const attachment = formData.resumeAttachment;
        const signature = attachment?.content ? `${attachment.filename}:${attachment.content.length}` : '';
        const includeAttachment = attachment && signature !== serverResumeSignatureRef.current;
        const response = await fetch('/api/application-drafts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resumeToken}` },
          body: JSON.stringify({ draft: draftPayload(includeAttachment ? attachment : null) }),
        });
        if (!response.ok) throw new Error(response.status === 404 ? 'EXPIRED' : 'SAVE_FAILED');
        if (includeAttachment) serverResumeSignatureRef.current = signature;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        if (error.message === 'EXPIRED') {
          setResumeToken('');
          localStorage.removeItem(`${storageKey}_resumeToken`);
        }
        setSaveStatus('idle');
      }
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(saveTimerRef.current);
  }, [formData, currentStep, completedSteps, activeTasks, resumeToken, draftPayload, storageKey]);

  const emailContinueLink = async () => {
    const email = String(resumeLinkEmail || formData.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResumeLinkError('Enter a valid email address.');
      return;
    }
    setResumeLinkStatus('sending');
    setResumeLinkError('');
    try {
      let attachment = formData.resumeAttachment || null;
      if (!attachment && formData.resumeFileUrl) {
        const record = await getResumeFile(storageKey).catch(() => null);
        if (record) attachment = await resumeRecordToAttachment(record);
      }
      const savedDraft = draftPayload(attachment);
      const response = await fetch('/api/application-drafts/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousToken: resumeToken || undefined,
          draft: {
            ...savedDraft,
            email,
            formData: { ...savedDraft.formData, email },
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'The private link could not be sent.');
      setResumeToken(result.token);
      setFormData(previous => ({ ...previous, email }));
      localStorage.setItem(`${storageKey}_resumeToken`, result.token);
      if (attachment?.content) serverResumeSignatureRef.current = `${attachment.filename}:${attachment.content.length}`;
      setResumeLinkEmail(email);
      setResumeLinkStatus('sent');
      setSaveStatus('saved');
    } catch (error) {
      setResumeLinkError(error.message);
      setResumeLinkStatus('idle');
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}_step`);
      localStorage.removeItem(`${storageKey}_completed`);
      localStorage.removeItem(`${storageKey}_tasks`);
      localStorage.removeItem(`${storageKey}_flowVersion`);
      localStorage.removeItem(`${storageKey}_submissionId`);
      const token = resumeToken;
      localStorage.removeItem(`${storageKey}_resumeToken`);
      if (token) fetch('/api/application-drafts', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, keepalive: true }).catch(() => {});
      deleteResumeFile(storageKey).catch(() => {});
    } catch {}
  };

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
    scrollToApplicationTop();
  }, []);

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
      veteranStatus: formData.veteranStatus,
    };

    const {
      eeoGender, eeoRace, veteranStatus,
      disabilityName, disabilityDate, disabilityEmployeeId, disabilityStatus,
      disabilitySignature, disabilitySignatureDate,
      resumeAttachment, resumeParsedPreview, ...appDataClean
    } = formData;

    // A lost response or refresh must retry the same submission, not send another email.
    if (!submissionIdRef.current) {
      try { submissionIdRef.current = localStorage.getItem(`${storageKey}_submissionId`) || ''; } catch {}
      submissionIdRef.current ||= crypto.randomUUID();
      try { localStorage.setItem(`${storageKey}_submissionId`, submissionIdRef.current); } catch {}
    }
    const applicationId = submissionIdRef.current;

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
      const message = deliveryResult.error || 'We could not deliver your application to HR. Please try again.';
      throw new Error(deliveryResult.applicationId ? `${message} Application reference: ${deliveryResult.applicationId}` : message);
    }

    clearDraft();
    submissionIdRef.current = '';
    setSubmittedId(deliveryResult.applicationId || applicationId);
    setConfirmationSent(Boolean(deliveryResult.confirmationSent));
    setSubmitted(true);
  };

  const stepProps = { formData, setFormData, onNext: goNext, onBack: goBack };
  const activeTask = activeTasks[currentStep] || 0;
  const submissionIssues = getSubmissionIssues(formData, REQUIRED_FIELDS);
  const setActiveTask = taskIndex => {
    setActiveTasks(previous => ({ ...previous, [currentStep]: taskIndex }));
    scrollToApplicationTop();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StartStep onNext={goNext} requisition={requisition} />;
      case 1: return (
        <GroupedApplicationStep onBack={goBack} onNext={goNext} stepIndex={1} activeTask={activeTask} onTaskChange={setActiveTask}>
          <ResumeStep {...stepProps} resumeStorageKey={storageKey} />
          <ApplicationInfoStep {...stepProps} />
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
          <VeteranStep {...stepProps} />
        </GroupedApplicationStep>
      );
      case 6: return <ReviewStep formData={formData} onBack={goBack} onSubmit={handleSubmit} onNavigate={goFixReviewItem} requiredFields={REQUIRED_FIELDS} />;
      default: return null;
    }
  };

  if (submitted) {
    return (
      <div className="portal-theme portal-application">
        <Header />
        <main id="main-content" tabIndex={-1} className="portal-confirmation">
          <div className="portal-confirmation__surface">
            <CheckCircle2 aria-hidden="true" size={36} className="portal-confirmation__check" />
            <p className="portal-eyebrow">Application received</p>
            <h1>Thank you, {formData.firstName}.</h1>
            <p className="portal-confirmation__intro">
              Your application for <strong>{requisition?.title || formData.positionAppliedFor || 'this position'}</strong> has been received. Our HR team will review your information and contact you if your experience matches the role.
            </p>
            <div className="portal-confirmation__record">
              <h2>Confirmation details</h2>
              <p>
                {confirmationSent ? 'Confirmation sent to:' : 'Applicant email:'}{' '}
                <strong>{formData.email}</strong>
              </p>
              <p>Application ID: <code>{submittedId}</code></p>
            </div>
            <a href="/#open-roles" className="portal-button portal-button--primary">
              View All Open Positions <ExternalLink aria-hidden="true" size={16} />
            </a>
            <p className="portal-confirmation__help">Questions? <a href="mailto:employment@geolabs.net">Contact our HR team</a>.</p>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="portal-theme portal-application">
      <div ref={applicationSurfaceRef}>
      <Header />
      <main id="main-content" tabIndex={-1} className="portal-application__main">
        <div className="portal-application__container">

          {/* Draft restored banner */}
          {draftRestored && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-5 py-3"
            >
              <div>
                <RotateCcw aria-hidden="true" className="w-4 h-4 text-blue-600 flex-shrink-0" />
              </div>
              <p className="text-xs text-blue-700 flex-1">
                <strong>Your progress has been restored.</strong> Pick up right where you left off.
              </p>
              <button type="button" onClick={() => setDraftRestored(false)} aria-label="Dismiss restored progress message" className="text-blue-400 hover:text-blue-600 text-lg leading-none transition-colors">×</button>
            </motion.div>
          )}

          {currentStep > 0 && (
            <div className="portal-application__context">
              <div>
                <p className="portal-eyebrow">Employment application</p>
                <h1>{requisition?.title || 'General Application'}</h1>
                {requisition && <p className="portal-application__location">{requisition.department} · {requisition.office || 'Geolabs, Inc.'}</p>}
              </div>
              <div className="portal-application__save">
                <div role="status" aria-live="polite" aria-atomic="true" className="portal-save-status">
                  {saveStatus === 'saving'
                    ? <><Loader2 aria-hidden="true" size={14} className="animate-spin" /> Saving progress…</>
                    : <><Cloud aria-hidden="true" size={14} /> {resumeToken ? 'Saved securely' : 'Saved on this device'}</>}
                </div>
                <button type="button" onClick={() => { setResumeLinkEmail(formData.email || ''); setResumeLinkError(''); setResumeLinkStatus('idle'); setResumeLinkOpen(true); }} className="portal-button portal-button--secondary">
                  <Mail aria-hidden="true" size={15} /> Continue on another device
                </button>
              </div>
            </div>
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

          <div className={currentStep > 0 ? 'portal-application__workspace' : 'portal-application__welcome'}>
            {currentStep > 0 && (
              <aside className="portal-application__rail">
                <Stepper
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  onStepClick={goToStep}
                  activeTask={activeTask}
                  onTaskClick={setActiveTask}
                  reviewHasBlockers={submissionIssues.length > 0}
                />
                <p className="portal-application__help">Need a hand?<br /><a href="mailto:employment@geolabs.net">Contact our HR team</a></p>
              </aside>
            )}
            <div className="portal-application__panel">
              {currentStep > 0 && <AccessibilityToolbar targetSelector="#application-step-content" contentKey={`${currentStep}-${activeTask}`} />}
              <div className="portal-application__form">
              <StepShell stepKey={`${currentStep}-${activeTask}`}>
                {renderStep()}
              </StepShell>
              </div>
              {currentStep === 0 && <AccessibilityToolbar targetSelector="#application-step-content" contentKey={`${currentStep}-${activeTask}`} />}
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
      </div>
      {resumeLinkOpen && (
        <div className="portal-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setResumeLinkOpen(false); }}>
          <div ref={resumeDialogRef} role="dialog" aria-modal="true" aria-labelledby="continue-link-title" aria-describedby={resumeLinkStatus === 'sent' ? undefined : 'continue-link-description'} className="portal-dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A4A22]">Save and continue later</p>
                <h2 id="continue-link-title" className="mt-1 text-xl font-extrabold tracking-tight text-slate-950">Email me a private link</h2>
              </div>
              <button type="button" onClick={() => setResumeLinkOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X aria-hidden="true" className="h-4 w-4" /></button>
            </div>
            {resumeLinkStatus === 'sent' ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div><p className="text-sm font-bold text-emerald-900">Private link sent</p><p className="mt-1 text-xs leading-relaxed text-emerald-800">Check <strong>{resumeLinkEmail}</strong>. Your application will now save securely and can be continued on another device.</p></div>
                </div>
                <button type="button" data-continue-done onClick={() => setResumeLinkOpen(false)} className="mt-4 w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800">Done</button>
              </div>
            ) : (
              <>
                <p id="continue-link-description" className="mt-3 text-sm leading-relaxed text-slate-600">We’ll securely save your current progress and email a private link that expires in 30 days. Do not forward the email—anyone with the link can access your saved application.</p>
                <label htmlFor="continue-email" className="mt-5 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-700">Email address</label>
                <input id="continue-email" type="email" value={resumeLinkEmail} onChange={event => setResumeLinkEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" aria-invalid={Boolean(resumeLinkError)} aria-describedby={resumeLinkError ? 'continue-email-error' : undefined} className="portal-field__control mt-2" />
                {resumeLinkError && <p id="continue-email-error" role="alert" className="mt-2 text-sm font-semibold text-red-700">{resumeLinkError}</p>}
                <button type="button" onClick={emailContinueLink} disabled={resumeLinkStatus === 'sending'} aria-busy={resumeLinkStatus === 'sending'} className="portal-button portal-button--primary mt-5 w-full">
                  {resumeLinkStatus === 'sending' ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending private link…</> : <><Mail className="h-4 w-4" /> Email my link</>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
