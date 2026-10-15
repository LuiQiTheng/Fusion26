import React from 'react';
import { ArrowLeft, Compass, MapPin, Award } from 'lucide-react';

interface AuthLayoutProps {
  onBack: () => void;
  children: React.ReactNode;
}

const heroImage = '/images/places/mlk-stadthuys.jpg';

/** Subtle lattice motif loosely inspired by songket / pucuk rebung patterns. */
const HeritagePattern: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} aria-hidden="true" focusable="false">
    <defs>
      <pattern id="auth-lattice" width="56" height="56" patternUnits="userSpaceOnUse">
        <path d="M28 4 L52 28 L28 52 L4 28 Z" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M28 18 L38 28 L28 38 L18 28 Z" fill="none" stroke="currentColor" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#auth-lattice)" />
  </svg>
);

const BrandMark: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-tropical-teal flex items-center justify-center text-white">
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C8 7 6 11 6 17c0 3.3 2.7 6 6 6s6-2.7 6-6c0-6-2-10-6-15zm0 17c-1.7 0-3-1.3-3-3 0-2.5 1.5-5 3-7.5 1.5 2.5 3 5 3 7.5 0 1.7-1.3 3-3 3z" />
      </svg>
    </div>
    <div className="leading-tight">
      <p className="font-serif font-bold text-lg text-white">Malaysia Heritage Explorer</p>
      <p className="text-[11px] tracking-wide text-white/70">FUSION 2026</p>
    </div>
  </div>
);

const highlights = [
  { icon: <Compass className="w-4 h-4" aria-hidden="true" />, text: 'Discover verified heritage places across Malaysia' },
  { icon: <MapPin className="w-4 h-4" aria-hidden="true" />, text: 'Plan walkable trips that respect your time' },
  { icon: <Award className="w-4 h-4" aria-hidden="true" />, text: 'Earn badges through cultural missions' },
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({ onBack, children }) => (
  <div className="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-tropical-mist text-deep-teal">
    {/* Brand panel: compact header on mobile, full panel on desktop */}
    <aside className="relative overflow-hidden bg-deep-teal text-white lg:min-h-screen">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-25 hidden lg:block"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-deep-teal/70 to-deep-teal hidden lg:block" aria-hidden="true" />
      <HeritagePattern className="absolute inset-0 w-full h-full text-white/[0.06]" />

      <div className="relative flex flex-col h-full px-6 py-5 lg:px-12 lg:py-12 lg:min-h-screen">
        <BrandMark />

        <div className="hidden lg:flex flex-1 flex-col justify-center max-w-md py-12">
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-sunshine-yellow px-3 py-1 text-xs font-bold text-deep-teal">
            Heritage in the Loop
          </span>
          <h2 className="mt-6 font-serif text-4xl xl:text-5xl font-bold leading-tight">
            Journey through Malaysia’s living heritage
          </h2>
          <div className="mt-5 h-1 w-14 rounded-full bg-coral-orange" aria-hidden="true" />
          <p className="mt-5 text-white/80 leading-relaxed">
            From Melaka’s Stadthuys to royal mosques and ancient valleys, keep your favourite places,
            trips and cultural progress together in one place.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map((h) => (
              <li key={h.text} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sunshine-yellow">
                  {h.icon}
                </span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="hidden lg:block text-xs text-white/60">
          Photo: The Stadthuys, Melaka · Prototype build, no real accounts
        </p>
      </div>
    </aside>

    {/* Form panel */}
    <main className="flex flex-col px-4 sm:px-8 py-6 lg:px-12">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 -ml-2 text-sm font-semibold text-tropical-teal hover:bg-tropical-teal/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tropical-teal/40"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to website
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md rounded-2xl bg-white border border-tropical-teal/10 shadow-sm p-6 sm:p-8">
          {children}
        </div>
      </div>
    </main>
  </div>
);
