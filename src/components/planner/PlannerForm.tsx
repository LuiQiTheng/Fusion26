import React, { useState, useEffect } from 'react';
import { Sparkles, Footprints, Car, Bus, Clock, AlertCircle } from 'lucide-react';
import { StateRecord, HeritagePlace, TransportMode, BudgetLevel } from '../../types';
import { PlannerOptions } from '../../lib/planner';
import { isCompactDistrict, getDefaultTransportMode } from '../../lib/routing';

interface PlannerFormProps {
  states: StateRecord[];
  places: HeritagePlace[];
  onGenerate: (options: PlannerOptions) => void;
  isLoading?: boolean;
  initialStateId?: string;
  initialTransportMode?: TransportMode;
}

export const PlannerForm: React.FC<PlannerFormProps> = ({
  states,
  places,
  onGenerate,
  isLoading = false,
  initialStateId,
  initialTransportMode,
}) => {
  // Destination State
  const [destinationStateId, setDestinationStateId] = useState(() => {
    return initialStateId && initialStateId !== 'ALL' ? initialStateId : 'MLK';
  });

  // Track whether the user has explicitly selected a transport mode
  const [userSelectedMode, setUserSelectedMode] = useState<boolean>(false);

  // Initialize transport mode based on geographic spread of physical attractions
  const [transportMode, setTransportMode] = useState<TransportMode>(() => {
    if (initialTransportMode && initialTransportMode !== 'mixed') return initialTransportMode;
    const targetState = initialStateId && initialStateId !== 'ALL' ? initialStateId : 'MLK';
    const def = getDefaultTransportMode(places, targetState);
    return def === 'mixed' ? 'walking' : def;
  });

  // When initialStateId changes from external controls
  useEffect(() => {
    if (initialStateId && initialStateId !== 'ALL') {
      setDestinationStateId(initialStateId);
      // Only adjust mode if user has NOT explicitly made an active selection
      if (!userSelectedMode) {
        const def = getDefaultTransportMode(places, initialStateId);
        setTransportMode(def === 'mixed' ? 'walking' : def);
      }
    }
  }, [initialStateId, places, userSelectedMode]);

  const handleDestinationStateChange = (newStateId: string) => {
    setDestinationStateId(newStateId);
    // Keep user's explicit choice if set; otherwise default based on state's geographic density
    if (!userSelectedMode) {
      const def = getDefaultTransportMode(places, newStateId);
      setTransportMode(def === 'mixed' ? 'walking' : def);
    }
  };

  const handleSelectMode = (mode: TransportMode) => {
    setTransportMode(mode);
    setUserSelectedMode(true);
  };

  const [availableHours, setAvailableHours] = useState(3.5);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Living Tradition',
    'Architecture',
    'Colonial',
  ]);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>('flexible');

  const activeState = states.find((s) => s.id === destinationStateId) || states[0];
  const isCompact = isCompactDistrict(places, destinationStateId);

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

  // Accurate time budget formatting helper
  const formatTimeBudget = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) {
      return `${h} ${h === 1 ? 'hour' : 'hours'} (${totalMinutes} mins)`;
    }
    return `${h} ${h === 1 ? 'hr' : 'hrs'} ${m} mins (${totalMinutes} mins)`;
  };

  // Map between hours and slider percentage (0 to 100) so that 4.0h is exactly at the middle (50%) of the bar
  const hoursToSliderPos = (h: number): number => {
    if (h <= 1.5) return 0;
    if (h <= 4.0) {
      return ((h - 1.5) / 2.5) * 50;
    }
    return 50 + ((h - 4.0) / 4.0) * 50;
  };

  const sliderPosToHours = (pos: number): number => {
    if (pos <= 0) return 1.5;
    if (pos >= 100) return 8.0;
    if (pos <= 50) {
      const raw = 1.5 + (pos / 50) * 2.5;
      return Math.round(raw * 2) / 2;
    } else {
      const raw = 4.0 + ((pos - 50) / 50) * 4.0;
      return Math.round(raw * 2) / 2;
    }
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
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-teal-900/10 shadow-md shadow-teal-900/5">
      {/* Header */}
      <div className="pb-6 border-b border-teal-900/10 mb-6">
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#0A2F25]">
          Smart Cultural Itinerary Planner
        </h2>
        <p className="text-xs text-[#0A2F25]/70 mt-1">
          Explainable constraint-based routing adhering to authentic heritage time budgets
        </p>
      </div>

      {/* Custom Planning Form */}
      <form onSubmit={handleCustomSubmit} className="space-y-6">
          {/* Destination & Time Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#0A2F25] uppercase tracking-wider mb-2">
                Destination State
              </label>
              <select
                value={destinationStateId}
                onChange={(e) => handleDestinationStateChange(e.target.value)}
                className="w-full p-3 rounded-xl border border-teal-900/15 text-sm font-medium text-[#0A2F25] bg-white focus:outline-hidden focus:border-[#C5A028] cursor-pointer"
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
                <label className="text-xs font-bold text-[#0A2F25] uppercase tracking-wider">
                  Available Time Budget
                </label>
                <span className="text-xs font-bold text-[#087E83] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTimeBudget(availableHours)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={hoursToSliderPos(availableHours)}
                onChange={(e) => setAvailableHours(sliderPosToHours(parseFloat(e.target.value)))}
                className="w-full accent-[#0A2F25] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#0A2F25]/50 mt-1">
                <span>1.5h (Express)</span>
                <span>4.0h (Half-Day)</span>
                <span>8.0h (Full Day)</span>
              </div>
            </div>
          </div>

          {/* Cultural Interests Selection */}
          <div>
            <label className="block text-xs font-bold text-[#0A2F25] uppercase tracking-wider mb-2">
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
                        ? 'bg-[#0A2F25] text-white shadow-xs font-semibold'
                        : 'bg-white text-[#0A2F25]/80 hover:bg-[#EBF5F0] hover:text-[#0A2F25] border border-teal-900/10'
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
              <label className="block text-xs font-bold text-[#0A2F25] uppercase tracking-wider mb-2">
                Transport Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectMode('walking')}
                  className={`py-3 px-2 rounded-xl text-xs font-medium border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                    transportMode === 'walking'
                      ? 'border-[#0A2F25] bg-[#EBF5F0] text-[#0A2F25] font-semibold ring-1 ring-[#0A2F25]/30'
                      : 'border-teal-900/10 bg-white text-[#0A2F25]/70 hover:bg-[#EBF5F0]'
                  }`}
                >
                  <Footprints className="w-4 h-4 text-[#B88E18] shrink-0" />
                  <span>Walking</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMode('car')}
                  className={`py-3 px-2 rounded-xl text-xs font-medium border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                    transportMode === 'car'
                      ? 'border-[#0A2F25] bg-[#EBF5F0] text-[#0A2F25] font-semibold ring-1 ring-[#0A2F25]/30'
                      : 'border-teal-900/10 bg-white text-[#0A2F25]/70 hover:bg-[#EBF5F0]'
                  }`}
                >
                  <Car className="w-4 h-4 text-[#B88E18] shrink-0" />
                  <span>Car / Ride</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMode('public_transport')}
                  className={`py-3 px-2 rounded-xl text-xs font-medium border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                    transportMode === 'public_transport'
                      ? 'border-[#0A2F25] bg-[#EBF5F0] text-[#0A2F25] font-semibold ring-1 ring-[#0A2F25]/30'
                      : 'border-teal-900/10 bg-white text-[#0A2F25]/70 hover:bg-[#EBF5F0]'
                  }`}
                >
                  <Bus className="w-4 h-4 text-[#B88E18] shrink-0" />
                  <span>Transit</span>
                </button>
              </div>

              {/* Contextual Guidance Notes */}
              {isCompact && transportMode === 'car' && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Compact Heritage District: </strong> Sights in {activeState?.name || 'this state'} are clustered within walking distance (&le; 4 km). Driving may encounter one-way streets, pedestrian zones, and limited parking around historic monuments. Walking is recommended.
                  </p>
                </div>
              )}

              {!isCompact && transportMode === 'walking' && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Dispersed Heritage Sites: </strong> Attractions in {activeState?.name || 'this state'} span wider road distances (&gt; 4 km). Walking between distant locations is not practical; driving or ride-hailing is recommended.
                  </p>
                </div>
              )}

              {transportMode === 'walking' && (
                <p className="text-[11px] text-[#0A2F25]/60 mt-1.5 flex items-center gap-1">
                  <Footprints className="w-3.5 h-3.5 text-[#B88E18]" />
                  Walking times calibrated at a realistic 4.5 km/h pedestrian pace.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A2F25] uppercase tracking-wider mb-2">
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
                        ? 'border-[#0A2F25] bg-[#EBF5F0] text-[#0A2F25] font-semibold ring-1 ring-[#0A2F25]/30'
                        : 'border-teal-900/10 bg-white text-[#0A2F25]/70 hover:bg-[#EBF5F0]'
                    }`}
                  >
                    {b === 'low' ? 'Free / Low' : b}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#0A2F25]/50 mt-2">
                *Unknown entry fees are preserved rather than assumed zero.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#0A2F25] hover:bg-[#0E3D31] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-[#E5C05C]" />
            {isLoading ? 'Optimizing Itinerary...' : 'Generate Customized Itinerary'}
          </button>
        </form>
    </div>
  );
};
