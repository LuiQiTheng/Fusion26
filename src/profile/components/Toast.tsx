import React, { useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastTone = 'success' | 'error';

export interface ToastMessage {
  id: number; // change the id to show a new toast, even with the same text
  tone: ToastTone;
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
  // Success toasts close themselves. Error toasts stay until dismissed.
  autoHideMs?: number;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]';

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, autoHideMs = 4000 }) => {
  const onDismissRef = useRef(onDismiss);

  // Keep the latest callback without restarting the timer on every render.
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  const toastId = toast?.id;
  const toastTone = toast?.tone;

  useEffect(() => {
    if (toastId === undefined || toastTone !== 'success') return;
    const timer = window.setTimeout(() => onDismissRef.current(), autoHideMs);
    return () => window.clearTimeout(timer);
  }, [toastId, toastTone, autoHideMs]);

  if (!toast) return null;

  const isSuccess = toast.tone === 'success';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div
        // Errors are announced immediately; success messages are announced politely.
        role={isSuccess ? 'status' : 'alert'}
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-md ${
          isSuccess
            ? 'border-[#D4AF37]/50 bg-[#0A1F1C]/95 text-[#F5F5F0]'
            : 'border-red-400/50 bg-red-950/90 text-[#F5F5F0]'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" aria-hidden="true" />
        ) : (
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" aria-hidden="true" />
        )}
        <p className="flex-1 break-words text-sm">{toast.text}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className={`-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#F5F5F0]/70 hover:text-white cursor-pointer ${FOCUS}`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};