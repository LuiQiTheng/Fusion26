import React from 'react';
import { Globe, Lock, Users } from 'lucide-react';
import { DEFAULT_MEMORY_VISIBILITY, MEMORY_VISIBILITY_LABELS, MemoryVisibility, isMemoryVisibility } from '../types';

interface VisibilityBadgeProps {
  visibility: MemoryVisibility;
  // "dark" matches the existing dark Profile pages, "light" matches the Light Tropical Friends pages.
  tone?: 'dark' | 'light';
}

const TONES = {
  dark: 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#E5C05C]',
  light: 'border-[#087E83]/30 bg-[#E6F3ED] text-[#0A2F25]',
} as const;

export const VisibilityBadge: React.FC<VisibilityBadgeProps> = ({ visibility, tone = 'dark' }) => {
  // An unrecognised value is shown as what it effectively is: Private.
  const value = isMemoryVisibility(visibility) ? visibility : DEFAULT_MEMORY_VISIBILITY;
  const Icon = value === 'public' ? Globe : value === 'friends' ? Users : Lock;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${TONES[tone]}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only">Visibility: </span>
      {MEMORY_VISIBILITY_LABELS[value]}
    </span>
  );
};