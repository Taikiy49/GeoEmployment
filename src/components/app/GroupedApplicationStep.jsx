import React from 'react';
import NavigationButtons from './NavigationButtons';
import { APPLICATION_STAGE_TASKS } from './Stepper';

export default function GroupedApplicationStep({
  children,
  onBack,
  onNext,
  stepIndex,
  activeTask = 0,
  onTaskChange,
}) {
  const taskNames = APPLICATION_STAGE_TASKS[stepIndex] || [];
  const tasks = React.Children.toArray(children);
  const safeActiveTask = Math.min(activeTask, Math.max(0, tasks.length - 1));

  const moveBack = () => {
    if (safeActiveTask > 0) {
      onTaskChange(safeActiveTask - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    onBack();
  };

  const moveNext = () => {
    if (safeActiveTask < tasks.length - 1) {
      onTaskChange(safeActiveTask + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    onNext();
  };

  return (
    <div>
      <div className="[&_.application-navigation]:hidden">
        <section aria-label={taskNames[safeActiveTask]}>
          {tasks[safeActiveTask]}
        </section>
      </div>
      <NavigationButtons onBack={moveBack} onNext={moveNext} />
    </div>
  );
}
