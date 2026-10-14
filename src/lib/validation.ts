import { HeritagePlace, StateRecord, CulturalMission } from '../types';

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  placeCount: number;
  stateCount: number;
}

export function validateDataset(
  states: StateRecord[],
  places: HeritagePlace[],
  missions: CulturalMission[]
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stateIds = new Set<string>();
  const placeIds = new Set<string>();

  // Check states
  states.forEach((state) => {
    if (stateIds.has(state.id)) {
      errors.push(`Duplicate state ID found: ${state.id}`);
    }
    stateIds.add(state.id);

    if (!state.name || !state.shortOverview) {
      errors.push(`State ${state.id} is missing a required name or short overview.`);
    }

    if (state.sourceReferences.length === 0 && state.verificationStatus === 'verified') {
      warnings.push(`State ${state.id} marked as verified but has 0 source references.`);
    }
  });

  // Check places
  places.forEach((place) => {
    if (placeIds.has(place.id)) {
      errors.push(`Duplicate place ID found: ${place.id}`);
    }
    placeIds.add(place.id);

    if (!stateIds.has(place.stateId)) {
      errors.push(`Place ${place.id} references non-existent state ID: ${place.stateId}`);
    }

    if (place.latitude !== undefined && (place.latitude < -90 || place.latitude > 90)) {
      errors.push(`Place ${place.id} has invalid latitude: ${place.latitude}`);
    }

    if (place.longitude !== undefined && (place.longitude < -180 || place.longitude > 180)) {
      errors.push(`Place ${place.id} has invalid longitude: ${place.longitude}`);
    }

    if (place.visitDurationMinutes !== undefined && place.visitDurationMinutes < 0) {
      errors.push(`Place ${place.id} has negative visit duration: ${place.visitDurationMinutes}`);
    }

    if (place.estimatedCostMYR !== null && place.estimatedCostMYR !== undefined && place.estimatedCostMYR < 0) {
      errors.push(`Place ${place.id} has negative cost: ${place.estimatedCostMYR}`);
    }

    if (place.sources.length === 0 && place.verificationStatus === 'verified') {
      warnings.push(`Place ${place.id} marked verified but lacks source references.`);
    }
  });

  // Check missions
  missions.forEach((mission) => {
    mission.placeIds.forEach((pid) => {
      if (!placeIds.has(pid)) {
        errors.push(`Mission ${mission.id} references non-existent place: ${pid}`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    placeCount: places.length,
    stateCount: states.length,
  };
}
