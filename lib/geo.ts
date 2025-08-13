export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8 // miles
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function latitudeRange(lat: number, radiusMiles: number): { minLat: number; maxLat: number } {
  const milesPerDegree = 69.0
  const delta = radiusMiles / milesPerDegree
  return { minLat: lat - delta, maxLat: lat + delta }
}


