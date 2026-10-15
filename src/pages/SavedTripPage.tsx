import React from 'react';
import { Itinerary, HeritagePlace, CulturalMission, MissionProof } from '../types';
import { PlaceCard } from '../components/places/PlaceCard';
import { Bookmark, Calendar, Trash2, ArrowRight, Camera, CheckCircle2 } from 'lucide-react';
import { NavTab } from '../components/layout/Navbar';
import { getUnlockedBadges } from '../lib/badges';

interface SavedTripPageProps {
  savedItinerary: Itinerary | null;
  favorites: string[];
  places: HeritagePlace[];
  completedMissionIds: string[];
  missions: CulturalMission[];
  onToggleFavorite: (id: string) => void;
  onSelectPlace: (place: HeritagePlace) => void;
  onInspectAI: (place: HeritagePlace) => void;
  onNavigate: (tab: NavTab) => void;
  onClearAllSaved: () => void;
  proofs?: Record<string, MissionProof>;
}

export const SavedTripPage: React.FC<SavedTripPageProps> = ({
  savedItinerary,
  favorites,
  places,
  completedMissionIds,
  missions,
  onToggleFavorite,
  onSelectPlace,
  onInspectAI,
  onNavigate,
  onClearAllSaved,
  proofs = {},
}) => {
  const favoritePlaces = places.filter((p) => favorites.includes(p.id));
  const completedMissions = missions.filter((m) => completedMissionIds.includes(m.id));
  const unlockedBadges = getUnlockedBadges(completedMissionIds.length);
  const proofList = Object.values(proofs);

  const hasAnySaved =
    savedItinerary !== null ||
    favoritePlaces.length > 0 ||
    completedMissions.length > 0 ||
    proofList.length > 0;

  return (
    <div className="space-y-8 min-h-[60vh] w-full">
      {/* Title & Clear Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/20">
        <div>
          <h1 className="font-serif font-bold text-3xl text-[#F5F5F0]">
            Saved Trips & Explorer Passport
          </h1>
          <p className="text-xs text-[#F5F5F0]/70 mt-1">
            Persisted locally in your browser storage. Your verified badges, field photos, and saved itineraries
          </p>
        </div>

        {hasAnySaved && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all locally saved itineraries, bookmarks, and badges?')) {
                onClearAllSaved();
              }
            }}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 self-start sm:self-auto py-2 px-3 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Clear All Local Data
          </button>
        )}
      </div>

      {!hasAnySaved ? (
        <div className="p-12 text-center bg-[#0A1F1C]/90 rounded-3xl border border-[#D4AF37]/25 shadow-lg space-y-4 w-full">
          <div className="w-14 h-14 rounded-2xl bg-[#04100E] text-[#D4AF37] flex items-center justify-center mx-auto border border-[#D4AF37]/30">
            <Bookmark className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-serif font-bold text-xl text-[#F5F5F0]">
              No Saved Cultural Data Yet
            </h3>
            <p className="text-xs text-[#F5F5F0]/70 leading-relaxed">
              Explore heritage places or generate a personalized itinerary to save trips, bookmark favorite locations, and earn verified explorer badges.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('explore')}
              className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#04100E] font-bold text-xs shadow-xs hover:bg-[#E5C05C] cursor-pointer transition-colors"
            >
              Generate Itinerary
            </button>
            <button
              onClick={() => onNavigate('missions')}
              className="px-5 py-2.5 rounded-xl bg-[#04100E] text-[#F5F5F0] font-semibold text-xs hover:bg-[#0E2925] border border-[#D4AF37]/30 cursor-pointer transition-colors"
            >
              Explore Missions
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Unlocked Badges Showcase Banner */}
          {unlockedBadges.length > 0 && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#04100E] via-[#0A1F1C] to-[#082622] text-[#F5F5F0] shadow-xl space-y-4 border border-[#D4AF37]/35">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-slate-950">
                    Official Recognition
                  </span>
                  <h2 className="font-serif font-bold text-2xl text-[#F5F5F0] mt-1">
                    Your Cultural Explorer Badges ({unlockedBadges.length} Earned)
                  </h2>
                </div>
                <button
                  onClick={() => onNavigate('missions')}
                  className="text-xs font-bold text-[#E5C05C] hover:text-[#00F0FF] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  View All Missions & Badges →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {unlockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-[#D4AF37]/30 flex items-center gap-3.5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#0E2925] border border-[#D4AF37]/40 text-2xl flex items-center justify-center shrink-0">
                      {badge.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-serif font-bold text-sm text-[#F5F5F0]">{badge.name}</h4>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                      </div>
                      <p className="text-[11px] text-[#E5C05C]/90 leading-tight mt-0.5">
                        {badge.level} Rank • Verified on-site
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified Field Photos Gallery */}
          {proofList.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/20">
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#F5F5F0] flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#D4AF37]" />
                  <span>Verified Field Proofs ({proofList.length})</span>
                </h2>
                <span className="text-xs text-[#F5F5F0]/70 font-medium">Captured On-Site</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {proofList.map((proof) => (
                  <div
                    key={proof.missionId}
                    className="group rounded-2xl bg-[#0A1F1C]/85 border border-[#D4AF37]/25 overflow-hidden shadow-lg hover:border-[#D4AF37] transition-all flex flex-col justify-between"
                  >
                    <div className="relative h-40 w-full bg-[#04100E] overflow-hidden">
                      <img
                        src={proof.photoDataUrl}
                        alt="Proof of Visit"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </div>
                    <div className="p-3 space-y-0.5">
                      <p className="font-serif font-bold text-xs text-[#F5F5F0] line-clamp-1">
                        {proof.placeName || 'Heritage Site'}
                      </p>
                      <p className="text-[10px] text-[#F5F5F0]/60">{proof.uploadedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Itinerary Section */}
          {savedItinerary && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/20">
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#F5F5F0] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#D4AF37]" />
                  <span>Saved Itinerary</span>
                </h2>
                <button
                  onClick={() => onNavigate('explore')}
                  className="text-xs font-bold text-[#E5C05C] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Open in Planner <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-[#0A1F1C]/90 border border-[#D4AF37]/25 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#04100E] text-[#E5C05C] border border-[#D4AF37]/30">
                      {savedItinerary.destinationStateId} Plan
                    </span>
                    <h3 className="font-serif font-bold text-xl text-[#F5F5F0] mt-1.5">
                      {savedItinerary.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#F5F5F0]/80 bg-[#04100E] px-3.5 py-2 rounded-xl border border-[#D4AF37]/25">
                    <span>⏱ {savedItinerary.totalPlannedMinutes} mins</span>
                    <span>🏛 {savedItinerary.stops.length} stops</span>
                    <span className="capitalize">🚶 {savedItinerary.transportMode}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#D4AF37]/15">
                  {savedItinerary.stops.map((stop) => {
                    const place = places.find((p) => p.id === stop.placeId);
                    if (!place) return null;
                    return (
                      <div
                        key={stop.placeId}
                        onClick={() => onSelectPlace(place)}
                        className="p-3.5 rounded-2xl bg-[#04100E] border border-[#D4AF37]/25 hover:border-[#D4AF37] hover:bg-[#0E2925] cursor-pointer transition-all"
                      >
                        <span className="text-[10px] font-bold text-[#D4AF37]">Stop {stop.order}</span>
                        <p className="font-serif font-bold text-xs text-[#F5F5F0] line-clamp-1 mt-0.5">{place.name}</p>
                        <p className="text-[10px] text-[#F5F5F0]/60 mt-1">{stop.visitDurationMinutes} mins visit</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bookmarked Favourites Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/20">
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#F5F5F0] flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#D4AF37]" />
                <span>Bookmarked Heritage Places ({favoritePlaces.length})</span>
              </h2>
              {favoritePlaces.length > 0 && (
                <span className="text-xs text-[#F5F5F0]/70 font-medium">Quick Access</span>
              )}
            </div>

            {favoritePlaces.length === 0 ? (
              <div className="p-8 text-center bg-[#0A1F1C]/90 rounded-2xl border border-[#D4AF37]/25 text-xs text-[#F5F5F0]/70 italic">
                No monuments bookmarked yet. Click the bookmark icon on any place card in the Explore tab to save it here.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritePlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isFavorite={true}
                    onToggleFavorite={onToggleFavorite}
                    onSelect={onSelectPlace}
                    onInspectAI={onInspectAI}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
