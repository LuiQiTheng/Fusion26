export type VerificationStatus =
  | 'verified'
  | 'needs_verification'
  | 'demo_data';

export type RouteDataStatus =
  | 'geographic_only'
  | 'estimated'
  | 'simulated'
  | 'real_service';

export interface SourceReference {
  title: string;
  publisher: string;
  url: string;
  accessedAt?: string;
  notes?: string;
}

export interface HeritagePlace {
  id: string;
  name: string;
  malayName?: string;
  stateId: string;
  locality?: string;

  categories: string[];
  culturalThemes: string[];

  shortDescription: string;
  culturalContext: string;

  latitude?: number;
  longitude?: number;

  visitDurationMinutes?: number;
  estimatedCostMYR?: number | null;

  openingHoursText?: string;
  openingHoursVerified: boolean;

  accessibilityNotes?: string;
  culturalCareNotes?: string; // Etiquette, dress code, sacred boundaries

  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;

  sources: SourceReference[];

  verificationStatus: VerificationStatus;
  lastReviewedAt?: string;

  demoNotes?: string;
}

export interface StateRecord {
  id: string;
  name: string;
  capital: string;
  region: 'West Malaysia' | 'East Malaysia' | 'Federal Territory';
  shortOverview: string;
  culturalThemes: string[];
  sourceReferences: SourceReference[];
  verificationStatus: VerificationStatus;
  placeIds: string[];
  imageUrl?: string;
}

export interface ItineraryStop {
  placeId: string;
  order: number;
  visitDurationMinutes: number;
  arrivalOffsetMinutes?: number;
  travelFromPreviousMinutes?: number;
  routeDataStatus: RouteDataStatus;
  reasonSelected: string;
}

export type TransportMode = 'walking' | 'public_transport' | 'car' | 'mixed';
export type BudgetLevel = 'low' | 'moderate' | 'flexible';

export interface Itinerary {
  id: string;
  title: string;
  destinationStateId: string;
  createdAt: string;
  updatedAt: string;
  interests: string[];
  transportMode: TransportMode;
  availableMinutes: number;
  budgetLevel: BudgetLevel;
  stops: ItineraryStop[];
  assumptions: string[];
  totalVisitMinutes: number;
  totalTravelMinutes: number;
  totalPlannedMinutes: number;
  isCustomized?: boolean;
}

export type MissionType = 'notice' | 'learn' | 'reflect' | 'connect';

export interface CulturalMission {
  id: string;
  title: string;
  type: MissionType;
  instructions: string;
  placeIds: string[];
  learningObjective: string;
  explanation: string;
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectIndex?: number;
  reflectionPrompt?: string;
  sourceIds: string[];
  sensitivityNote?: string;
  verificationStatus: VerificationStatus;
}

export interface CuratedCollection {
  id: string;
  title: string;
  tagline: string;
  stateId: string;
  theme: string;
  placeIds: string[];
  recommendedDurationMinutes: number;
  description: string;
  imageUrl?: string;
}

export interface AIReasoningInspection {
  promptUsed: string;
  groundingSources: SourceReference[];
  culturalCareGuidelines: string[];
  excludedAssumptions: string[];
  hallucinationCheckPassed: boolean;
}
