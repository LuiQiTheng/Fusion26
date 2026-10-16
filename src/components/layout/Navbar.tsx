import React, { useState } from 'react';
import { Compass, MapPin, Bookmark, Menu, X, Award, LogIn, User } from 'lucide-react';

export type NavTab = 'home' | 'explore' | 'missions' | 'saved' | 'profile';

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
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4 text-[#D4AF37]" /> },
  ];

  const handleSelect = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-teal-900/10 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleSelect('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E6F3ED] via-[#F4F9F6] to-[#D5EDE2] border border-[#C5A028]/40 flex items-center justify-center text-[#B88E18] shadow-xs group-hover:scale-105 group-hover:border-[#087E83] transition-all">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8 7 6 11 6 17c0 3.3 2.7 6 6 6s6-2.7 6-6c0-6-2-10-6-15zm0 17c-1.7 0-3-1.3-3-3 0-2.5 1.5-5 3-7.5 1.5 2.5 3 5 3 7.5 0 1.7-1.3 3-3 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-[#0A2F25] tracking-tight">
                  Malaysia Heritage
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#C5A028]/15 text-[#996F09] border border-[#C5A028]/30">
                  Explorer
                </span>
              </div>
              <p className="text-[11px] text-[#0A2F25]/60 hidden sm:block">
                FUSION 2026 • Heritage in the Loop
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/90 text-[#0A2F25] font-bold shadow-xs border border-teal-900/10'
                      : 'text-[#0A2F25]/80 hover:text-[#0A2F25] hover:bg-white/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#C5A028] text-white">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#C5A028] rounded-full shadow-[0_0_8px_#C5A028]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sign In entry point (desktop) */}
          {onSignIn && (
            <button
              onClick={onSignIn}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#0A2F25] bg-white/80 border border-teal-900/15 hover:border-[#C5A028] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#B88E18]" aria-hidden="true" />
              Sign In
            </button>
          )}

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#0A2F25] hover:bg-black/5"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-teal-900/10 bg-[#F4F9F6]/95 backdrop-blur-md px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-[#0A2F25] font-bold border border-teal-900/10'
                    : 'text-[#0A2F25]/80 hover:bg-white/60 hover:text-[#0A2F25]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#C5A028] text-white">
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
              className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-3 rounded-xl text-sm font-bold text-[#0A2F25] bg-white border border-teal-900/15 hover:border-[#C5A028]"
            >
              <LogIn className="w-4 h-4 text-[#B88E18]" aria-hidden="true" />
              Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
};