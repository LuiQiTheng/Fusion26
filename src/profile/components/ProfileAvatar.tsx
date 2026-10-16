import React from 'react';
import { Compass, MapPin, Award, Bookmark, User } from 'lucide-react';
import { PRESET_AVATAR_IDS } from '../types';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface ProfileAvatarProps {
  avatarId: string;
  size?: AvatarSize;
  className?: string;
  // Used as the accessible label. Defaults to the avatar's own name.
  label?: string;
}

interface AvatarStyle {
  name: string;
  gradient: string;
  border: string;
  render: (iconClass: string) => React.ReactNode;
}

// Same leaf/flame mark used for the Navbar logo.
const LogoMark = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C8 7 6 11 6 17c0 3.3 2.7 6 6 6s6-2.7 6-6c0-6-2-10-6-15zm0 17c-1.7 0-3-1.3-3-3 0-2.5 1.5-5 3-7.5 1.5 2.5 3 5 3 7.5 0 1.7-1.3 3-3 3z" />
  </svg>
);

// Keyed by the ids in PRESET_AVATAR_IDS (see ../types).
const AVATARS: Record<string, AvatarStyle> = {
  'avatar-1': {
    name: 'Compass avatar',
    gradient: 'from-[#04100E] via-[#0A1F1C] to-[#174B4D]',
    border: 'border-[#D4AF37]/60',
    render: (c) => <Compass className={`${c} text-[#D4AF37]`} aria-hidden="true" />,
  },
  'avatar-2': {
    name: 'Map pin avatar',
    gradient: 'from-[#174B4D] via-[#0E2925] to-[#04100E]',
    border: 'border-[#00F0FF]/50',
    render: (c) => <MapPin className={`${c} text-[#00F0FF]`} aria-hidden="true" />,
  },
  'avatar-3': {
    name: 'Award avatar',
    gradient: 'from-[#3A2D0A] via-[#1F1805] to-[#04100E]',
    border: 'border-[#E5C05C]/60',
    render: (c) => <Award className={`${c} text-[#E5C05C]`} aria-hidden="true" />,
  },
  'avatar-4': {
    name: 'Bookmark avatar',
    gradient: 'from-[#0A1F1C] via-[#0E2925] to-[#174B4D]',
    border: 'border-[#D4AF37]/45',
    render: (c) => <Bookmark className={`${c} text-[#F5F5F0]`} aria-hidden="true" />,
  },
  'avatar-5': {
    name: 'Traveller avatar',
    gradient: 'from-[#0E2925] via-[#04100E] to-[#0A1F1C]',
    border: 'border-[#F5F5F0]/35',
    render: (c) => <User className={`${c} text-[#F5F5F0]`} aria-hidden="true" />,
  },
  'avatar-6': {
    name: 'Heritage mark avatar',
    gradient: 'from-[#174B4D] via-[#0A1F1C] to-[#3A2D0A]',
    border: 'border-[#D4AF37]/60',
    render: (c) => <LogoMark className={`${c} text-[#D4AF37]`} />,
  },
};

const FALLBACK_ID = PRESET_AVATAR_IDS[0];

// Display names for the avatar picker in Edit Profile.
export const AVATAR_LABELS: Record<string, string> = Object.fromEntries(
  PRESET_AVATAR_IDS.map((id) => [id, (AVATARS[id] ?? AVATARS[FALLBACK_ID]).name]),
);

const SIZE_CLASSES: Record<AvatarSize, { box: string; icon: string }> = {
  sm: { box: 'w-10 h-10', icon: 'w-5 h-5' },
  md: { box: 'w-14 h-14', icon: 'w-7 h-7' },
  lg: { box: 'w-20 h-20', icon: 'w-10 h-10' },
  xl: { box: 'w-28 h-28 sm:w-32 sm:h-32', icon: 'w-14 h-14 sm:w-16 sm:h-16' },
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarId,
  size = 'md',
  className = '',
  label,
}) => {
  // An unknown id falls back to the first avatar instead of rendering nothing.
  const avatar = AVATARS[avatarId] ?? AVATARS[FALLBACK_ID];
  const sizing = SIZE_CLASSES[size];

  return (
    <div
      role="img"
      aria-label={label ?? avatar.name}
      className={`${sizing.box} shrink-0 rounded-full bg-gradient-to-tr ${avatar.gradient} border-2 ${avatar.border} flex items-center justify-center shadow-md shadow-[#04100E]/50 ${className}`}
    >
      {avatar.render(sizing.icon)}
    </div>
  );
};