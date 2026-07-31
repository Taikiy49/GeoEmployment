import React from 'react';
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
  5: ['EEO survey', 'Disability form', 'Veteran status'],
  6: ['Review & submit'],
};

export default function Stepper({
  currentStep,
  completedSteps,
  onStepClick,
  activeTask = 0,
  onTaskClick,
}) {
  const progressPercent = Math.round((currentStep / (STEPS.length - 1)) * 100);
  const currentTasks = APPLICATION_STAGE_TASKS[currentStep] || [];

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2.5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Application progress
            </p>
            <p className="mt-1 text-sm font-bold text-[#8A4A22]">{STEPS[currentStep]}</p>
          </div>
          <span className="text-xs font-semibold tabular-nums text-slate-500">{progressPercent}% complete</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-slate-200/80">
          <div
            className="h-full rounded-full bg-[#A65F2A] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {STEPS.map((label, stepIndex) => {
          const isActive = stepIndex === currentStep;
          const isCompleted = completedSteps.includes(stepIndex) || stepIndex < currentStep;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onStepClick(stepIndex)}
              className={`flex flex-none items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-colors ${
                isActive
                  ? 'bg-[#A65F2A] text-white'
                  : isCompleted
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${
                isActive ? 'bg-white/20 text-white' : isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'
              }`}>
                {isCompleted && !isActive ? <Check className="h-2.5 w-2.5" /> : stepIndex + 1}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {currentTasks.length > 1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Tasks in this section
          </p>
          <div className="flex flex-wrap gap-2">
            {currentTasks.map((task, taskIndex) => (
              <button
                key={task}
                type="button"
                onClick={() => onTaskClick?.(taskIndex)}
                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition-colors ${
                  taskIndex === activeTask
                    ? 'border-[#A65F2A] bg-[#A65F2A] text-white shadow-sm'
                    : taskIndex < activeTask
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#A65F2A]/40 hover:bg-[#F8F0E9] hover:text-[#8A4A22]'
                }`}
              >
                <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold shadow-sm ${
                  taskIndex === activeTask
                    ? 'bg-white/20 text-white'
                    : taskIndex < activeTask
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-white text-[#A65F2A]'
                }`}>
                  {taskIndex + 1}
                </span>
                {task}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
