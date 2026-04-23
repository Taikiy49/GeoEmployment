import React from 'react';
import { Check } from 'lucide-react';

const BRANCHES = [
  { label: 'Employment Application', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { label: 'Self-Identification', steps: [11, 12, 13] },
  { label: 'Alcohol & Drug Testing', steps: [14] },
  { label: 'Review & Submit', steps: [15] },
];

const STEP_LABELS = [
  'Start', 'Resume', 'Application', 'General', 'Employment',
  'Education', 'Skills', 'References', 'Medical', 'Affiliations',
  'Certification', 'EEO', 'Disability', 'Veteran',
  'Alcohol & Drug', 'Review',
];

export default function Stepper({ currentStep, completedSteps, onStepClick }) {
  const activeBranch = BRANCHES.findIndex(b => b.steps.includes(currentStep));
  const totalSteps = STEP_LABELS.length;
  const progressPercent = Math.round((completedSteps.length / totalSteps) * 100);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-[#6b7280]">Progress</span>
        <span className="text-[11px] font-semibold text-bronze">{progressPercent}%</span>
      </div>
      <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #b87333 0%, #d4a574 100%)',
          }}
        />
      </div>

      {/* Branch pills */}
      <div className="flex flex-wrap gap-2 mt-3">
        {BRANCHES.map((branch, bIdx) => {
          const isActive = bIdx === activeBranch;
          const isCompleted = branch.steps.every(s => completedSteps.includes(s));
          return (
            <button
              key={bIdx}
              onClick={() => onStepClick(branch.steps[0])}
              className={`
                px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 border
                ${isActive
                  ? 'bg-bronze text-white border-bronze shadow-sm'
                  : isCompleted
                    ? 'bg-success-soft text-success border-success-light'
                    : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#cbd5e1]'
                }
              `}
            >
              {isCompleted && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
              {branch.label}
            </button>
          );
        })}
      </div>

      {/* Step pills for active branch */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {BRANCHES[activeBranch >= 0 ? activeBranch : 0].steps.map((stepIdx) => {
          const isActive = stepIdx === currentStep;
          const isCompleted = completedSteps.includes(stepIdx);
          return (
            <button
              key={stepIdx}
              onClick={() => onStepClick(stepIdx)}
              className={`
                px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-200 border
                ${isActive
                  ? 'bg-bronze-soft text-bronze-dark border-bronze-border shadow-sm'
                  : isCompleted
                    ? 'bg-success-soft text-success border-success-light'
                    : 'bg-white text-[#9ca3af] border-[#e5e7eb] hover:text-[#6b7280]'
                }
              `}
            >
              {isCompleted && !isActive && <Check className="w-2.5 h-2.5 inline mr-0.5 -mt-px" />}
              {STEP_LABELS[stepIdx]}
            </button>
          );
        })}
      </div>
    </div>
  );
}