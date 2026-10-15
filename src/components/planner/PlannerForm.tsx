import React, { useState } from 'react';
import { Sparkles, Sliders, Footprints, Car, Bus, Bike, Clock, Compass } from 'lucide-react';
import { StateRecord, TransportMode, BudgetLevel } from '../../types';
import { PlannerOptions } from '../../lib/planner';

interface PlannerFormProps {
  states: StateRecord[];
  onGenerate: (options: PlannerOptions) => void;
  isLoading?: boolean;
}

export const PlannerForm: React.FC<PlannerFormProps> = ({
  states,
  onGenerate,
  isLoading = false,
}) => {
  const [modeTab, setModeTab] = useState<'quick' | 'custom'>('quick');

  // Form State
  const [destinationStateId, setDestinationStateId] = useState('MLK');
  const [availableHours, setAvailableHours] = useState(3.5);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Living Tradition',
    'Architecture',
    'Colonial',
  ]);
  const [transportMode, setTransportMode] = useState<TransportMode>('walking');
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>('flexible');

  const availableInterestOptions = [
    'Living Tradition',
    'Architecture',
    'Colonial',
    'Religious',
    'Maritime Trade',
    'Malay Sultanate',
    'Peranakan Heritage',
    'Culinary Heritage',
    'Craftsmanship',
  ];

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((i) => i !== interest));
      }
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleQuickSubmit = () => {
    onGenerate({
      destinationStateId: 'MLK',
      availableMinutes: 210, // 3.5 hours
      interests: ['Living Tradition', 'Architecture', 'Colonial'],
      transportMode: 'walking',
      budgetLevel: 'flexible',
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      destinationStateId,
      availableMinutes: Math.round(availableHours * 60),
      interests: selectedInterests,
      transportMode,
      budgetLevel,
    });
  };

  return (
    <div className="bg-[#0A1F1C]/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/25 shadow-lg">
      {/* Tab Switcher: Quick vs Custom */}
      <div className="flex items-center justify-between pb-6 border-b border-[#D4AF37]/15 mb-6">
        <div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#F5F5F0]">
            Smart Cultural Itinerary Planner
          </h2>
          <p className="text-xs text-[#F5F5F0]/70 mt-1">
            Explainable constraint-based routing adhering to authentic heritage time budgets
          </p>
        </div>

        <div className="flex bg-[#04100E] p-1 rounded-xl border border-[#D4AF37]/25">
          <button
            type="button"
            onClick={() => setModeTab('quick')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              modeTab === 'quick'
                ? 'bg-[#D4AF37] text-[#04100E] shadow-xs'
                : 'text-[#F5F5F0]/70 hover:text-[#F5F5F0]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${modeTab === 'quick' ? 'text-[#04100E]' : 'text-[#D4AF37]'}`} />
            Quick Mode
          </button>
          <button
            type="button"
            onClick={() => setModeTab('custom')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              modeTab === 'custom'
                ? 'bg-[#D4AF37] text-[#04100E] shadow-xs'
                : 'text-[#F5F5F0]/70 hover:text-[#F5F5F0]'
            }`}
          >
            <Sliders className={`w-3.5 h-3.5 ${modeTab === 'custom' ? 'text-[#04100E]' : 'text-[#D4AF37]'}`} />
            Custom Plan
          </button>
        </div>
      </div>

      {modeTab === 'quick' ? (
        /* Quick Mode Banner */
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#04100E] via-[#0A1F1C] to-[#0E2925] border border-[#D4AF37]/35 shadow-md">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-[#0E2925] text-[#D4AF37] border border-[#D4AF37]/30 shadow-md">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-base text-[#F5F5F0]">
                  Melaka UNESCO Heritage Starter Trail
                </h3>
                <p className="text-xs text-[#F5F5F0]/80 leading-relaxed">
                  Generates an optimal 3.5-hour curated walking loop connecting Dutch Square, A Famosa, Harmony Street vernacular mosques & temples, and Jonker Walk craftsmen.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold text-[#E5C05C]">
                  <span className="px-2 py-0.5 rounded-md bg-[#04100E] border border-[#D4AF37]/30">
                    ⏱ 3.5 Hours Total
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#04100E] border border-[#D4AF37]/30">
                    🚶 100% Pedestrian Walking
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#04100E] border border-[#D4AF37]/30">
                    🏛 4 Sourced Monuments
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickSubmit}
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C05C] text-[#04100E] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? 'Synthesizing Itinerary...' : 'Generate Instant Melaka Itinerary'}
          </button>
        </div>
      ) : (
        /* Custom Planning Form */
        <form onSubmit={handleCustomSubmit} className="space-y-6">
          {/* Destination & Time Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#E5C05C] uppercase tracking-wider mb-2">
                Destination State
              </label>
              <select
                value={destinationStateId}
                onChange={(e) => setDestinationStateId(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#D4AF37]/30 text-sm font-medium text-[#F5F5F0] bg-[#04100E] focus:outline-hidden focus:border-[#D4AF37] cursor-pointer"
              >
                <option value="MLK">Melaka (Primary Showcase)</option>
                {states
                  .filter((s) => s.id !== 'MLK')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.region})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#E5C05C] uppercase tracking-wider">
                  Available Time Budget
                </label>
                <span className="text-xs font-bold text-[#00F0FF] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {availableHours} hours ({Math.round(availableHours * 60)} mins)
                </span>
              </div>
              <input
                type="range"
                min="1.5"
                max="8.0"
                step="0.5"
                value={availableHours}
                onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
                className="w-full accent-[#D4AF37] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#F5F5F0]/50 mt-1">
                <span>1.5h (Express)</span>
                <span>4.0h (Half-Day)</span>
                <span>8.0h (Full Day)</span>
              </div>
            </div>
          </div>

          {/* Cultural Interests Selection */}
          <div>
            <label className="block text-xs font-bold text-[#E5C05C] uppercase tracking-wider mb-2">
              Cultural Interests & Themes
            </label>
            <div className="flex flex-wrap gap-2">
              {availableInterestOptions.map((interest) => {
                const isChecked = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-[#D4AF37] text-[#04100E] shadow-xs font-semibold'
                        : 'bg-[#04100E] text-[#F5F5F0]/80 hover:bg-[#0E2925] hover:text-[#F5F5F0] border border-[#D4AF37]/20'
                    }`}
                  >
                    {isChecked ? '✓ ' : '+ '}
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transport Mode & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#E5C05C] uppercase tracking-wider mb-2">
                Transport Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransportMode('walking')}
                  className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                    transportMode === 'walking'
                      ? 'border-[#D4AF37] bg-[#0E2925] text-[#F5F5F0] font-semibold ring-1 ring-[#D4AF37]/50'
                      : 'border-[#D4AF37]/20 bg-[#04100E] text-[#F5F5F0]/70 hover:bg-[#0E2925]'
                  }`}
                >
                  <Footprints className="w-4 h-4 text-[#D4AF37]" /> Walking
                </button>
                <button
                  type="button"
                  onClick={() => setTransportMode('car')}
                  className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                    transportMode === 'car'
                      ? 'border-[#D4AF37] bg-[#0E2925] text-[#F5F5F0] font-semibold ring-1 ring-[#D4AF37]/50'
                      : 'border-[#D4AF37]/20 bg-[#04100E] text-[#F5F5F0]/70 hover:bg-[#0E2925]'
                  }`}
                >
                  <Car className="w-4 h-4 text-[#D4AF37]" /> Car / Ride
                </button>
                <button
                  type="button"
                  onClick={() => setTransportMode('public_transport')}
                  className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                    transportMode === 'public_transport'
                      ? 'border-[#D4AF37] bg-[#0E2925] text-[#F5F5F0] font-semibold ring-1 ring-[#D4AF37]/50'
                      : 'border-[#D4AF37]/20 bg-[#04100E] text-[#F5F5F0]/70 hover:bg-[#0E2925]'
                  }`}
                >
                  <Bus className="w-4 h-4 text-[#D4AF37]" /> Public Transit
                </button>
                <button
                  type="button"
                  onClick={() => setTransportMode('mixed')}
                  className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                    transportMode === 'mixed'
                      ? 'border-[#D4AF37] bg-[#0E2925] text-[#F5F5F0] font-semibold ring-1 ring-[#D4AF37]/50'
                      : 'border-[#D4AF37]/20 bg-[#04100E] text-[#F5F5F0]/70 hover:bg-[#0E2925]'
                  }`}
                >
                  <Bike className="w-4 h-4 text-[#D4AF37]" /> Mixed
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E5C05C] uppercase tracking-wider mb-2">
                Budget Sensitivity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'moderate', 'flexible'] as BudgetLevel[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudgetLevel(b)}
                    className={`py-3 px-2 rounded-xl text-xs font-medium capitalize border transition-all text-center cursor-pointer ${
                      budgetLevel === b
                        ? 'border-[#D4AF37] bg-[#0E2925] text-[#F5F5F0] font-semibold ring-1 ring-[#D4AF37]/50'
                        : 'border-[#D4AF37]/20 bg-[#04100E] text-[#F5F5F0]/70 hover:bg-[#0E2925]'
                    }`}
                  >
                    {b === 'low' ? 'Free / Low' : b}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#F5F5F0]/50 mt-2">
                *Unknown entry fees are preserved rather than assumed zero.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C05C] text-[#04100E] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? 'Optimizing Itinerary...' : 'Generate Customized Itinerary'}
          </button>
        </form>
      )}
    </div>
  );
};
