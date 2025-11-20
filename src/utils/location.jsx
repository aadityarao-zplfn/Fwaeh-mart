/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Formats distance for display (e.g., "5.2 km" or "850m")
 */
export const formatDistance = (distance) => {
  if (distance === Infinity || distance === null || distance === undefined) return '';
  return distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)} km`;
};