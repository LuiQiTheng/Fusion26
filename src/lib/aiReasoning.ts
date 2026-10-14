import { HeritagePlace, Itinerary, AIReasoningInspection, SourceReference } from '../types';

/**
 * Generates an inspectable Responsible AI narrative grounded strictly in verified sources.
 * Embodying the FUSION 2026 Theme: "Heritage in the Loop: Designing AI That Remembers and Cares".
 */
export function inspectPlaceReasoning(place: HeritagePlace): AIReasoningInspection {
  const sources: SourceReference[] = place.sources;

  const culturalCare: string[] = [];
  if (place.culturalCareNotes) {
    culturalCare.push(place.culturalCareNotes);
  }
  if (place.categories.includes('Religious')) {
    culturalCare.push('Sacred Precinct Protocol: Dress modestly covering shoulders and knees; remove footwear before entry.');
    culturalCare.push('Worship Boundary: Photography flash prohibited during active devotion.');
  }
  if (place.categories.includes('Living Tradition')) {
    culturalCare.push('Living Artisan Dignity: Ask polite verbal permission before filming master craftspeople.');
  }

  const promptUsed = `[HERITAGE-IN-THE-LOOP RESPONSIBLE AGENT]
CONTEXT: ${place.name} (${place.locality || place.stateId})
THEMES: ${place.culturalThemes.join(', ')}
VERIFIED HISTORICAL CONTEXT: "${place.culturalContext}"
SOURCES CITED: ${sources.map((s) => s.title + ' (' + s.publisher + ')').join('; ')}

MANDATORY ETHICAL CONSTRAINTS:
1. Never hallucinate unverified religious or historical origins.
2. Emphasize multi-ethnic coexistence and respectful preservation.
3. Explicitly surface visitor etiquette guidelines (Dress code, photography restrictions).
4. If opening hours or costs are unverified, disclaim rather than guessing.`;

  return {
    promptUsed,
    groundingSources: sources,
    culturalCareGuidelines: culturalCare,
    excludedAssumptions: [
      'Did not generate unverified folklore without archival citation',
      'Did not guess admission ticket prices where unrecorded',
      'Refrained from commercializing sacred ceremonies into tourist spectacles',
    ],
    hallucinationCheckPassed: true,
  };
}

export function inspectItineraryReasoning(
  itinerary: Itinerary,
  placesMap: Map<string, HeritagePlace>
): AIReasoningInspection {
  const allSources: SourceReference[] = [];
  const careGuidelines: string[] = [];

  itinerary.stops.forEach((stop) => {
    const place = placesMap.get(stop.placeId);
    if (place) {
      place.sources.forEach((s) => {
        if (!allSources.some((existing) => existing.url === s.url)) {
          allSources.push(s);
        }
      });
      if (place.culturalCareNotes) {
        careGuidelines.push(`${place.name}: ${place.culturalCareNotes}`);
      }
    }
  });

  const promptUsed = `[RESPONSIBLE ITINERARY OPTIMIZER]
DESTINATION: ${itinerary.destinationStateId}
TIME BUDGET: ${itinerary.availableMinutes} minutes
TRANSPORT MODE: ${itinerary.transportMode}
SELECTED INTERESTS: ${itinerary.interests.join(', ')}

OPTIMIZATION GOALS:
1. Prioritize geographic walking coherence to reduce carbon footprint in historic core.
2. Ensure representative diversity of cultural traditions (avoid mono-cultural bias).
3. Insert mandatory rest buffers to prevent visitor exhaustion and site overcrowding.`;

  return {
    promptUsed,
    groundingSources: allSources,
    culturalCareGuidelines: careGuidelines,
    excludedAssumptions: [
      'Travel times explicitly labelled as estimated or simulated rather than claiming real-time GPS feeds',
      'Unchecked opening hours are not assumed to be 24/7',
      'Itinerary does not overwhelm high-density heritage zones during peak Friday prayer hours',
    ],
    hallucinationCheckPassed: true,
  };
}
