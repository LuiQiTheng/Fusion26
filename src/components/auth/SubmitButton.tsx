import React from 'react';
import { Loader2 } from 'lucide-react';

export const SubmitButton: React.FC<{ loading: boolean; label: string; loadingLabel: string }> = ({
  loading,
  label,
  loadingLabel,
}) => (
  <button
    type="submit"
    disabled={loading}
    aria-busy={loading}
    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-tropical-teal px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-deep-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tropical-teal focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
  >
    {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
    {loading ? loadingLabel : label}
  </button>
);
