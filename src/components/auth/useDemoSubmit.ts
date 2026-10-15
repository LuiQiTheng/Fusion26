import { useCallback, useEffect, useRef, useState } from 'react';

const DEMO_DELAY_MS = 900;

/**
 * Simulates a short submission so loading/disabled states can be shown.
 * No network request is made and no form values are read, stored or logged.
 * Replace `run` with a real auth call when a provider is connected.
 */
export function useDemoSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const busy = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = useCallback((message: string, onDone?: () => void) => {
    if (busy.current) return; // prevents duplicate submissions
    busy.current = true;
    setSubmitting(true);
    setNotice(null);
    timer.current = window.setTimeout(() => {
      busy.current = false;
      setSubmitting(false);
      setNotice(message);
      onDone?.();
    }, DEMO_DELAY_MS);
  }, []);

  return { submitting, notice, setNotice, run };
}

export function focusFirstInvalid(ids: string[]) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) {
      el.focus();
      return;
    }
  }
}
