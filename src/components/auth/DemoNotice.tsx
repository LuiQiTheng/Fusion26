import React from 'react';
import { Info } from 'lucide-react';

export const DemoNotice: React.FC<{ message: string | null }> = ({ message }) => (
  <div role="status" aria-live="polite">
    {message && (
      <div className="flex items-start gap-2.5 rounded-xl border border-sunshine-yellow/70 bg-sunshine-yellow/15 px-4 py-3 text-sm text-deep-teal">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-deep-teal" aria-hidden="true" />
        <span>{message}</span>
      </div>
    )}
  </div>
);
