import foodVendorsData from '../data/food_vendors.json';
import { HeritagePlace, TraditionalFoodVendor, Itinerary } from '../types';

export const allFoodVendors: TraditionalFoodVendor[] = foodVendorsData as TraditionalFoodVendor[];

export const vendorById = new Map<string, TraditionalFoodVendor>();
export const vendorByPlaceId = new Map<string, TraditionalFoodVendor>();

allFoodVendors.forEach((v) => {
  vendorById.set(v.id, v);
  if (v.placeId) {
    vendorByPlaceId.set(v.placeId, v);
  }
});

export function getFoodVendorById(id: string): TraditionalFoodVendor | undefined {
  return vendorById.get(id) || vendorByPlaceId.get(id);
}

export function isFoodVendorStopId(stopId: string): boolean {
  return vendorById.has(stopId) || vendorByPlaceId.has(stopId);
}

export function isFoodVendorInItinerary(
  vendor: TraditionalFoodVendor,
  itinerary: Itinerary | null
): boolean {
  if (!itinerary || !itinerary.stops) return false;
  return itinerary.stops.some(
    (s) => s.placeId === vendor.id || (vendor.placeId && s.placeId === vendor.placeId)
  );
}

export function convertFoodVendorToPlace(v: TraditionalFoodVendor, originalPlace?: HeritagePlace): HeritagePlace {
  if (originalPlace) {
    return {
      ...originalPlace,
      latitude: originalPlace.latitude ?? (typeof v.latitude === 'number' ? v.latitude : undefined),
      longitude: originalPlace.longitude ?? (typeof v.longitude === 'number' ? v.longitude : undefined),
      location_name: originalPlace.location_name || v.restaurantName,
      locality: originalPlace.locality || v.address,
    };
  }

  return {
    id: v.placeId || v.id,
    name: v.foodName,
    malayName: v.foodName,
    stateId: v.stateId,
    locality: v.address,
    categories: ['Food', 'Traditional Food'],
    culturalThemes: ['Traditional Culinary Heritage', v.foodName],
    shortDescription: `${v.restaurantName} — ${v.notes}`,
    culturalContext: v.notes,
    latitude: v.latitude ?? undefined,
    longitude: v.longitude ?? undefined,
    visitDurationMinutes: 45,
    estimatedCostMYR: 15,
    openingHoursText: 'Check vendor listing for operating hours',
    openingHoursVerified: v.verificationStatus === 'verified',
    accessibilityNotes: v.address,
    culturalCareNotes: 'Authentic local cuisine; check halal and dietary preferences.',
    imageUrl: `/images/cultural/${v.id}.jpg`,
    sources: [
      {
        title: v.restaurantName,
        publisher: 'Google Maps / Malaysia Heritage Food Directory',
        url: v.googleMapsUrl,
      },
    ],
    verificationStatus: v.verificationStatus === 'verified' ? 'verified' : 'needs_verification',
    lastReviewedAt: '2026-10-17',
    type: 'food',
    heritage_status: 'regional_tradition',
    location_type: v.latitude ? 'verified_venue' : 'regional_association',
    location_name: v.restaurantName,
    source_urls: [v.googleMapsUrl],
  };
}

/**
 * Returns the original places array enriched with food vendor coordinates and restaurant details,
 * WITHOUT adding duplicate food place records.
 */
export function getEnrichedPlacesWithFoodVendors(places: HeritagePlace[]): HeritagePlace[] {
  return places.map((p) => {
    const matchedVendor = vendorByPlaceId.get(p.id) || vendorById.get(p.id);
    if (
      matchedVendor &&
      typeof matchedVendor.latitude === 'number' &&
      typeof matchedVendor.longitude === 'number'
    ) {
      return {
        ...p,
        latitude: p.latitude ?? matchedVendor.latitude,
        longitude: p.longitude ?? matchedVendor.longitude,
        location_name: p.location_name || matchedVendor.restaurantName,
        locality: p.locality || matchedVendor.address,
      };
    }
    return p;
  });
}
