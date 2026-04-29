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
        <span className="text-xs text-[#64748b] font-medium tracking-wide">Application Progress</span>
        <span className="text-xs font-bold text-[#F5C400]">{progressPercent}%</span>
      </div>
      <div className="h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #F5C400, #EFB506)' }}
        />
      </div>

      {/* Phase tabs */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {BRANCHES.map((branch, bIdx) => {
          const isActive = bIdx === activeBranch;
          const isCompleted = branch.steps.every(s => completedSteps.includes(s));
          return (
            <button
              key={bIdx}
              onClick={() => onStepClick(branch.steps[0])}
              className={`
                flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border
                ${isActive
                  ? 'bg-[#F5C400] text-[#0d1117] border-[#F5C400] shadow-md shadow-[#F5C400]/20'
                  : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#0d1b2a] text-[#64748b] border-[#1e2a3a] hover:border-[#2d3f55] hover:text-[#94a3b8]'
                }
              `}
            >
              {isCompleted
                ? <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-white" /></span>
                : <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${isActive ? 'bg-[#0d1117]/30 text-[#0d1117]' : 'bg-[#1e2a3a] text-[#64748b]'}`}>{bIdx + 1}</span>
              }
              {branch.label}
            </button>
          );
        })}
      </div>

      {/* Sub-step pills */}
      <div className="flex flex-wrap gap-1.5">
        {BRANCHES[activeBranch >= 0 ? activeBranch : 0].steps.map((stepIdx) => {
          const isActive = stepIdx === currentStep;
          const isCompleted = completedSteps.includes(stepIdx);
          return (
            <button
              key={stepIdx}
              onClick={() => onStepClick(stepIdx)}
              className={`
                flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border
                ${isActive
                  ? 'bg-[#F5C400]/20 text-[#F5C400] border-[#F5C400]/50'
                  : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-[#0d1b2a] text-[#4a5568] border-[#1e2a3a] hover:text-[#64748b] hover:border-[#2d3f55]'
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