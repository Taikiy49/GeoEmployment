import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  'Start',
  'Your details',
  'Experience',
  'Requirements',
  'Drug policy',
  'Optional self-ID',
  'Review',
];

export const APPLICATION_STAGE_TASKS = {
  1: ['Resume', 'Position', 'Personal information'],
  2: ['Employment', 'Education', 'Skills'],
  3: ['References', 'Medical authorization', 'Affiliations', 'Certification'],
  4: ['Agreement & signature'],
  5: ['EEO survey', 'Veteran status'],
  6: ['Review & submit'],
};

export default function Stepper({
  currentStep,
  completedSteps,
  onStepClick,
  activeTask = 0,
  onTaskClick,
  reviewHasBlockers = false,
}) {
  const progressPercent = Math.round((currentStep / (STEPS.length - 1)) * 100);
  const currentTasks = APPLICATION_STAGE_TASKS[currentStep] || [];
  const stepsRef = useRef(null);
  useEffect(() => {
    // Keep the active stage visible in the horizontal phone layout without
    // scrolling the document or stealing focus from the incoming form.
    const rail = stepsRef.current;
    const active = rail?.querySelector('[aria-current="step"]');
    if (rail && active && window.matchMedia('(max-width: 959px)').matches) {
      rail.scrollLeft = Math.max(0, active.offsetLeft - rail.offsetLeft - 16);
    }
  }, [currentStep]);

  return (
    <nav className="portal-progress" aria-label="Application progress">
      <div>
        <div className="portal-progress__summary">
          <div>
            <p className="portal-eyebrow">
              Application progress
            </p>
            <p className="portal-progress__stage">{STEPS[currentStep]}</p>
          </div>
          <span className="portal-progress__status">
            {currentStep === STEPS.length - 1
              ? (reviewHasBlockers ? 'Needs attention' : 'Ready to submit')
              : `${progressPercent}% through application`}
          </span>
        </div>
        <div
          className="portal-progress__track"
          role="progressbar"
          aria-label="Application completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-valuetext={currentStep === STEPS.length - 1 && reviewHasBlockers ? 'Review needs attention' : `${progressPercent}% through application`}
        >
          <div
            className="portal-progress__fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div ref={stepsRef} className="portal-progress__steps">
        {STEPS.map((label, stepIndex) => {
          const isActive = stepIndex === currentStep;
          const isCompleted = completedSteps.includes(stepIndex);
          return (
            <button
              key={label}
              type="button"
              onClick={() => onStepClick(stepIndex)}
              aria-current={isActive ? 'step' : undefined}
              className={`portal-progress__step ${isActive ? 'is-current' : ''} ${isCompleted ? 'is-visited' : ''}`}
            >
              <span className="portal-progress__number" aria-hidden="true">
                {isCompleted && !isActive ? <Check size={14} /> : String(stepIndex + 1).padStart(2, '0')}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {currentTasks.length > 1 && (
        <div className="portal-progress__tasks">
          <p className="portal-eyebrow">
            Tasks in this section
          </p>
          <div className="portal-progress__task-list">
            {currentTasks.map((task, taskIndex) => (
              <button
                key={task}
                type="button"
                onClick={() => onTaskClick?.(taskIndex)}
                aria-current={taskIndex === activeTask ? 'step' : undefined}
                className={`portal-progress__task ${taskIndex === activeTask ? 'is-current' : ''}`}
              >
                <span aria-hidden="true">
                  {taskIndex + 1}
                </span>
                {task}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
