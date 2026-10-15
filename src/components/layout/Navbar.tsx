import React, { useState } from 'react';
import { Compass, MapPin, Bookmark, Menu, X, Award, LogIn } from 'lucide-react';

export type NavTab = 'home' | 'explore' | 'missions' | 'saved';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  favoritesCount: number;
  completedMissionsCount: number;
  onSignIn?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  favoritesCount,
  completedMissionsCount,
  onSignIn,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Compass className="w-4 h-4 text-[#D4AF37]" /> },
    { id: 'explore', label: 'Explore & Plan', icon: <MapPin className="w-4 h-4 text-[#D4AF37]" /> },
    { id: 'missions', label: 'Missions', icon: <Award className="w-4 h-4 text-[#D4AF37]" />, badge: completedMissionsCount },
    { id: 'saved', label: 'Saved Trips', icon: <Bookmark className="w-4 h-4 text-[#D4AF37]" />, badge: favoritesCount },
  ];

  const handleSelect = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#04100E]/85 backdrop-blur-md border-b border-[#D4AF37]/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleSelect('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#04100E] via-[#0A1F1C] to-[#174B4D] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-md shadow-[#04100E]/50 group-hover:scale-105 group-hover:border-[#00F0FF]/60 transition-all">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8 7 6 11 6 17c0 3.3 2.7 6 6 6s6-2.7 6-6c0-6-2-10-6-15zm0 17c-1.7 0-3-1.3-3-3 0-2.5 1.5-5 3-7.5 1.5 2.5 3 5 3 7.5 0 1.7-1.3 3-3 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-[#F5F5F0] tracking-tight">
                  Malaysia Heritage
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#E5C05C] border border-[#D4AF37]/35">
                  Explorer
                </span>
              </div>
              <p className="text-[11px] text-[#F5F5F0]/60 hidden sm:block">
                FUSION 2026 • Heritage in the Loop
              </p>
            </div>
          </div>

          {/* Clean 4-Column Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#D4AF37]/15 text-[#E5C05C] font-bold shadow-xs border border-[#D4AF37]/40'
                      : 'text-[#F5F5F0]/85 hover:text-white hover:bg-[#0E2925]/70'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#D4AF37] text-slate-950">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#D4AF37] rounded-full shadow-[0_0_8px_#D4AF37]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sign In entry point (desktop) */}
          {onSignIn && (
            <button
              onClick={onSignIn}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#F5F5F0] bg-gradient-to-r from-[#0A1F1C] to-[#0E2925] border border-[#D4AF37]/40 hover:border-[#00F0FF] hover:shadow-[0_0_15px_rgba(0,240,255,0.35)] transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
              Sign In
            </button>
          )}

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#F5F5F0] hover:bg-[#0E2925]/70"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#D4AF37]/25 bg-[#04100E]/95 backdrop-blur-md px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#D4AF37]/15 text-[#E5C05C] font-bold border border-[#D4AF37]/35'
                    : 'text-[#F5F5F0]/85 hover:bg-[#0E2925]/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#D4AF37] text-slate-950">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          {onSignIn && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSignIn();
              }}
              className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-3 rounded-xl text-sm font-bold text-[#F5F5F0] bg-gradient-to-r from-[#0A1F1C] to-[#0E2925] border border-[#D4AF37]/40 hover:border-[#00F0FF]"
            >
              <LogIn className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
              Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
};
