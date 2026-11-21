export const haversineMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,): number => {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export const findNearestLocation = <
  T extends { lat: number; lng: number; radiusMeters: number },>(
  user: { lat: number; lng: number },
  locations: T[],): { location: T | null; distance: number; inRadius: boolean } => {
  if (!locations.length)
    return { location: null, distance: Infinity, inRadius: false };
  let best = locations[0];
  let bestDist = haversineMeters(user.lat, user.lng, best.lat, best.lng);
  for (const loc of locations.slice(1)) {
    const d = haversineMeters(user.lat, user.lng, loc.lat, loc.lng);
    if (d < bestDist) {
      best = loc;
      bestDist = d;
    }
  }
  return {
    location: best,
    distance: bestDist,
    inRadius: bestDist <= best.radiusMeters,
  };
};
