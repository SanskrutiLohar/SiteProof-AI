/**
 * Geolocation & Haversine Distance Engine for Geofence Audit Validation
 */

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

// Known regional hubs and site centroids
export const KNOWN_LOCATION_COORDINATES: Record<string, GeoCoordinate> = {
  'nashik': { latitude: 19.9975, longitude: 73.7898 },
  'nashik, maharashtra': { latitude: 19.9975, longitude: 73.7898 },
  'mumbai': { latitude: 19.0760, longitude: 72.8777 },
  'pune': { latitude: 18.5204, longitude: 73.8567 },
  'nagpur': { latitude: 21.1458, longitude: 79.0882 },
  'bangalore': { latitude: 12.9716, longitude: 77.5946 },
  'bengaluru': { latitude: 12.9716, longitude: 77.5946 },
  'delhi': { latitude: 28.6139, longitude: 77.2090 },
  'hyderabad': { latitude: 17.3850, longitude: 78.4867 },
  'chennai': { latitude: 13.0827, longitude: 80.2707 },
  'ahmedabad': { latitude: 23.0225, longitude: 72.5714 },
};

/**
 * Calculates distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateHaversineDistance(
  coord1: GeoCoordinate,
  coord2: GeoCoordinate
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // 1 decimal precision
}

/**
 * Resolves approximate coordinates for a location string
 */
export function resolveLocationCoordinates(locationStr: string): GeoCoordinate | null {
  if (!locationStr) return null;

  // Check if string contains coordinates like "19.9975, 73.7898"
  const coordRegex = /(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/;
  const match = locationStr.match(coordRegex);
  if (match) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[3]),
    };
  }

  const normalized = locationStr.toLowerCase().trim();
  for (const [key, coords] of Object.entries(KNOWN_LOCATION_COORDINATES)) {
    if (normalized.includes(key)) {
      return coords;
    }
  }

  // Default to Nashik if location references Nashik
  if (normalized.includes('nashik')) {
    return KNOWN_LOCATION_COORDINATES['nashik'];
  }

  return null;
}

/**
 * Checks whether evidence GPS matches the authorized project site geofence
 */
export interface GeofenceValidationResult {
  isMismatch: boolean;
  distanceKm: number;
  expectedLocationName: string;
  actualLocationName?: string;
  warningMessage?: string;
}

export function validateEvidenceGeofence(
  evidenceLatitude?: number,
  evidenceLongitude?: number,
  projectLocationStr?: string,
  toleranceKm: number = 2.0 // 2 km allowable site radius
): GeofenceValidationResult {
  const expectedName = projectLocationStr || 'Authorized Project Site (Nashik)';

  if (!evidenceLatitude || !evidenceLongitude) {
    return {
      isMismatch: false,
      distanceKm: 0,
      expectedLocationName: expectedName,
    };
  }

  const expectedCoords = resolveLocationCoordinates(projectLocationStr || 'Nashik') || KNOWN_LOCATION_COORDINATES['nashik'];
  const actualCoords: GeoCoordinate = {
    latitude: evidenceLatitude,
    longitude: evidenceLongitude,
  };

  const distance = calculateHaversineDistance(expectedCoords, actualCoords);
  const isMismatch = distance > toleranceKm;

  return {
    isMismatch,
    distanceKm: distance,
    expectedLocationName: expectedName,
    warningMessage: isMismatch
      ? `Location Mismatch Alert: Uploaded ${distance} km away from authorized project site (${expectedName})`
      : undefined,
  };
}
