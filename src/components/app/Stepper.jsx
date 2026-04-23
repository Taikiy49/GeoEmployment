import React from 'react';
import { Check } from 'lucide-react';

const BRANCHES = [
  { label: 'Application', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { label: 'Self-ID', steps: [11, 12, 13] },
  { label: 'Drug Policy', steps: [14] },
  { label: 'Review', steps: [15] },
];

const STEP_LABELS = [
  'Start', 'Resume', 'Application', 'General', 'Employment',
  'Education', 'Skills', 'References', 'Medical', 'Affiliations',
  'Certification', 'EEO', 'Disability', 'Veteran',
  'Drug Policy', 'Review',
];

export default function Stepper({ currentStep, completedSteps, onStepClick }) {
  const activeBranch = BRANCHES.findIndex(b => b.steps.includes(currentStep));
  const totalSteps = STEP_LABELS.length;
  const progressPercent = Math.round((completedSteps.length / totalSteps) * 100);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400 font-medium">Your progress</span>
        <span className="text-xs font-semibold text-bronze">{progressPercent}%</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out bg-bronze"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Phase tabs */}
      <div className="flex gap-1.5 mt-3">
        {BRANCHES.map((branch, bIdx) => {
          const isActive = bIdx === activeBranch;
          const isCompleted = branch.steps.every(s => completedSteps.includes(s));
          return (
            <button
              key={bIdx}
              onClick={() => onStepClick(branch.steps[0])}
              className={`
                flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border
                ${isActive
                  ? 'bg-bronze text-white border-bronze shadow-sm'
                  : isCompleted
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              {isCompleted
                ? <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-white" /></span>
                : <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>{bIdx + 1}</span>
              }
              {branch.label}
            </button>
          );
        })}
      </div>

      {/* Sub-step pills for active branch */}
      <div className="flex flex-wrap gap-1.5">
        {BRANCHES[activeBranch >= 0 ? activeBranch : 0].steps.map((stepIdx) => {
          const isActive = stepIdx === currentStep;
          const isCompleted = completedSteps.includes(stepIdx);
          return (
            <button
              key={stepIdx}
              onClick={() => onStepClick(stepIdx)}
              className={`
                flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border
                ${isActive
                  ? 'bg-bronze text-white border-bronze'
                  : isCompleted
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-gray-600 hover:border-gray-300'
                }
              `}
            >
              {isCompleted && !isActive && <Check className="w-2.5 h-2.5" />}
              {STEP_LABELS[stepIdx]}
            </button>
          );
        })}
      </div>
    </div>
  );
}