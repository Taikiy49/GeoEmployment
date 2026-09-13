import React from 'react';

const messages = {
  processing: ['Preparing application files', 'The application is saved. Document preparation or email delivery is still in progress. Refresh shortly.'],
  sending: ['Email delivery needs review', 'Delivery started, but a final receipt is not yet recorded. Check the shared mailbox before requesting another copy.'],
  delivery_uncertain: ['Email delivery needs review', 'The application is saved, but email delivery could not be confirmed. Check the shared mailbox first; use the files below if available. Do not ask the applicant to submit again.'],
  delivery_failed: ['Email delivery failed', 'The application is saved in this portal. Use the available documents below and contact IT if any files are missing.'],
};

export default function DeliveryStatus({ application, compact = false }) {
  const message = messages[application.deliveryStatus];
  if (!message) return null;
  if (compact) return <div className="mt-1 text-[10px] font-semibold text-amber-800">{message[0]}</div>;
  return <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
    <p className="font-semibold">{message[0]}</p>
    <p className="mt-1 leading-relaxed">{message[1]}</p>
    <p className="mt-2 break-all">Application reference: {application.id}</p>
  </div>;
}
