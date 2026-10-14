import { HeritagePlace, BudgetLevel } from '../types';

export interface ScoreBreakdown {
  totalScore: number;
  interestScore: number;
  diversityScore: number;
  proximityScore: number;
  explanation: string;
}

export function scorePlace(
  place: HeritagePlace,
  selectedInterests: string[],
  existingThemesInItinerary: Set<string>,
  distanceKmFromPrevious: number | null,
  budgetPreference: BudgetLevel
): ScoreBreakdown {
  let interestScore = 0;
  const matchedInterests: string[] = [];

  // Match categories and themes
  selectedInterests.forEach((interest) => {
    const interestLower = interest.toLowerCase();
    const hasCategory = place.categories.some((c) => c.toLowerCase().includes(interestLower));
    const hasTheme = place.culturalThemes.some((t) => t.toLowerCase().includes(interestLower));

    if (hasCategory || hasTheme) {
      interestScore += 25;
      matchedInterests.push(interest);
    }
  });

  // Diversity bonus: reward themes not yet seen in the itinerary
  let diversityScore = 0;
  place.culturalThemes.forEach((theme) => {
    if (!existingThemesInItinerary.has(theme)) {
      diversityScore += 10;
    }
  });

  // Proximity score (prefer closer stops to minimize transit overhead)
  let proximityScore = 20;
  if (distanceKmFromPrevious !== null) {
    if (distanceKmFromPrevious <= 0.5) {
      proximityScore = 30; // Very close walk
    } else if (distanceKmFromPrevious <= 2.0) {
      proximityScore = 20;
    } else if (distanceKmFromPrevious <= 5.0) {
      proximityScore = 10;
    } else {
      proximityScore = 0; // Farther
    }
  }

  // Budget consideration (don't penalize missing costs, but favor free/low for low budget)
  let budgetAdjustment = 0;
  if (budgetPreference === 'low') {
    if (place.estimatedCostMYR === 0) {
      budgetAdjustment = 10;
    } else if (typeof place.estimatedCostMYR === 'number' && place.estimatedCostMYR > 30) {
      budgetAdjustment = -10;
    }
  }

  const totalScore = interestScore + diversityScore + proximityScore + budgetAdjustment;

  // Build honest explanation
  let explanation = '';
  if (matchedInterests.length > 0) {
    explanation = `Directly matches your interest in ${matchedInterests.join(' & ')}.`;
  } else if (diversityScore > 10) {
    explanation = `Introduces distinctive new cultural themes: ${place.culturalThemes.slice(0, 2).join(', ')}.`;
  } else if (distanceKmFromPrevious !== null && distanceKmFromPrevious <= 0.8) {
    explanation = `Conveniently situated within easy walking reach of your prior stop.`;
  } else {
    explanation = `Highlighted landmark essential to Melaka's historic landscape.`;
  }

  return {
    totalScore,
    interestScore,
    diversityScore,
    proximityScore,
    explanation,
  };
}
