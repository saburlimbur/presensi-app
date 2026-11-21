export const MAX_GPS_ACCURACY_TOLERANCE = 50;

export const effectiveTolerance = (accuracy) => {
  if (!Number.isFinite(accuracy) || accuracy <= 0) return 0;
  return Math.min(accuracy, MAX_GPS_ACCURACY_TOLERANCE);
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};
