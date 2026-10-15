import { Search, ShieldCheck, X, Grid, Map } from 'lucide-react';
import { StateRecord } from '../../types';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedStateId: string;
  onStateChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  verifiedOnly: boolean;
  onVerifiedOnlyChange: (val: boolean) => void;
  states: StateRecord[];
  categories: string[];
  totalResults: number;
  onResetFilters: () => void;
  viewMode?: 'grid' | 'map';
  onViewModeChange?: (mode: 'grid' | 'map') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedStateId,
  onStateChange,
  selectedCategory,
  onCategoryChange,
  verifiedOnly,
  onVerifiedOnlyChange,
  states,
  categories,
  totalResults,
  onResetFilters,
  viewMode,
  onViewModeChange,
}) => {
  const hasActiveFilters =
    searchTerm !== '' ||
    selectedStateId !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    verifiedOnly;

  return (
    <div className="bg-[#0A1F1C]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/25 shadow-lg space-y-4">
      {/* Top search & state selection */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search heritage monuments, temples, mosques, crafts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D4AF37]/30 text-sm text-[#F5F5F0] bg-[#04100E] focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all placeholder:text-[#F5F5F0]/40"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F5F5F0]/50 hover:text-[#F5F5F0] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* State dropdown */}
        <div className="sm:w-64">
          <select
            value={selectedStateId}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4AF37]/30 text-sm font-medium text-[#F5F5F0] bg-[#04100E] focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer"
          >
            <option value="ALL">All States & Territories (16)</option>
            <optgroup label="Showcase Destination">
              <option value="MLK">★ Melaka (UNESCO Showcase)</option>
            </optgroup>
            <optgroup label="Peninsular Malaysia">
              {states
                .filter((s) => s.region === 'West Malaysia' && s.id !== 'MLK')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="East Malaysia (Borneo)">
              {states
                .filter((s) => s.region === 'East Malaysia')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Federal Territories">
              {states
                .filter((s) => s.region === 'Federal Territory')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Category chips and verification toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-[#D4AF37]/15">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => onCategoryChange('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#D4AF37] text-[#04100E] shadow-xs'
                : 'bg-[#04100E] text-[#F5F5F0]/80 hover:bg-[#0E2925] hover:text-[#F5F5F0] border border-[#D4AF37]/20'
            }`}
          >
            All Themes
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#D4AF37] text-[#04100E] shadow-xs font-semibold'
                  : 'bg-[#04100E] text-[#F5F5F0]/80 hover:bg-[#0E2925] hover:text-[#F5F5F0] border border-[#D4AF37]/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Verification Check, Results count & View switcher */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 text-xs shrink-0">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-[#F5F5F0]/85 select-none">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => onVerifiedOnlyChange(e.target.checked)}
              className="rounded text-[#D4AF37] focus:ring-[#D4AF37] w-4 h-4 bg-[#04100E] border-[#D4AF37]/40"
            />
            <span className="flex items-center gap-1 text-[#F5F5F0]/90">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]" />
              Verified Sources Only
            </span>
          </label>

          <span className="text-[#F5F5F0]/65 font-medium">
            {totalResults} {totalResults === 1 ? 'place' : 'places'}
          </span>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-[#E5C05C] hover:text-white hover:underline font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}

          {viewMode && onViewModeChange && (
            <div className="flex items-center bg-[#04100E] p-0.5 rounded-xl border border-[#D4AF37]/30 shrink-0">
              <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#D4AF37] text-[#04100E] shadow-xs'
                    : 'text-[#F5F5F0]/60 hover:text-[#F5F5F0]'
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('map')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-[#D4AF37] text-[#04100E] shadow-xs'
                    : 'text-[#F5F5F0]/60 hover:text-[#F5F5F0]'
                }`}
                title="Map View"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
