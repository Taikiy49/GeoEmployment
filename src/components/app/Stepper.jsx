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
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);
  const activeBranchData = BRANCHES[activeBranch >= 0 ? activeBranch : 0];

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-end justify-between gap-4 mb-2.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Application progress
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              <span className="text-[#8A4A22]">{STEP_LABELS[currentStep]}</span>
              {currentStep === totalSteps - 1 && (
                <span className="ml-2 font-normal text-slate-500">Final review</span>
              )}
            </p>
          </div>
          <span className="text-xs font-semibold tabular-nums text-slate-500">{progressPercent}% complete</span>
        </div>
        <div className="h-1 bg-slate-200/80 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#A65F2A] transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quiet phase navigation */}
      <div className="flex items-center gap-0 overflow-x-auto border-b border-slate-200">
        {BRANCHES.map((branch, bIdx) => {
          const isActive = bIdx === activeBranch;
          const isCompleted = branch.steps.every(s => completedSteps.includes(s));
          return (
            <button
              key={bIdx}
              onClick={() => onStepClick(branch.steps[0])}
              className={`relative flex flex-none items-center gap-2 px-3 sm:px-4 pb-3 pt-1 text-xs font-semibold transition-colors ${
                isActive
                  ? 'text-slate-950'
                  : isCompleted
                    ? 'text-emerald-700 hover:text-emerald-800'
                    : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {isCompleted ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <span className={`text-[10px] tabular-nums ${isActive ? 'text-[#A65F2A]' : 'text-slate-400'}`}>
                  0{bIdx + 1}
                </span>
              )}
              {branch.label}
              {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#A65F2A]" />}
            </button>
          );
        })}
      </div>

      {/* Compact step navigation */}
      {activeBranchData.steps.length > 1 && <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {activeBranchData.steps.map((stepIdx, localIndex) => {
          const isActive = stepIdx === currentStep;
          const isCompleted = completedSteps.includes(stepIdx);
          return (
            <button
              key={stepIdx}
              onClick={() => onStepClick(stepIdx)}
              className={`group flex flex-none items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#A65F2A]/10 text-[#8A4A22]'
                  : isCompleted
                    ? 'text-emerald-700 hover:bg-emerald-50'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${
                isActive
                  ? 'bg-[#A65F2A] text-white'
                  : isCompleted
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
              }`}>
                {isCompleted && !isActive ? <Check className="h-2.5 w-2.5" /> : localIndex + 1}
              </span>
              {STEP_LABELS[stepIdx]}
            </button>
          );
        })}
      </div>}
    </div>
  );
}
