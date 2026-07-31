import React from 'react';
import NavigationButtons from './NavigationButtons';
import { APPLICATION_STAGE_TASKS } from './Stepper';

export default function GroupedApplicationStep({ children, onBack, onNext, stepIndex }) {
  const taskNames = APPLICATION_STAGE_TASKS[stepIndex] || [];

  return (
    <div>
      <div className="space-y-10 [&_.application-navigation]:hidden">
        {React.Children.map(children, (child, taskIndex) => (
          <section
            id={`application-task-${stepIndex}-${taskIndex}`}
            aria-label={taskNames[taskIndex]}
            className="scroll-mt-48"
          >
            {child}
          </section>
        ))}
      </div>
      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
