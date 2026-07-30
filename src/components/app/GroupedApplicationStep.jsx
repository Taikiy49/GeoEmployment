import React from 'react';
import NavigationButtons from './NavigationButtons';

export default function GroupedApplicationStep({ children, onBack, onNext }) {
  return (
    <div>
      <div className="space-y-10 [&_.application-navigation]:hidden">
        {children}
      </div>
      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
