import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom red marker for user location
const userLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSIxMCIgZmlsbD0iI2ZmNTc1NyIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjMiLz48L3N2Zz4=',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Custom red marker for shops
const shopMarkerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDguNyAxMi41IDI4LjUgMTIuNSAyOC41UzI1IDIxLjIgMjUgMTIuNUMyNSA1LjYgMTkuNCAwIDEyLjUgMHptMCAxN2MtMi41IDAtNC41LTItNC41LTQuNXMyLTQuNSA0LjUtNC41IDQuNSAyIDQuNSA0LjUtMiA0LjUtNC41IDQuNXoiIGZpbGw9IiNmZjU3NTciLz48L3N2Zz4=',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component to recenter map when user location changes
function RecenterMap({ center }) {
  const map = useMap();
  if (center) {
    map.setView(center, map.getZoom());
  }
  return null;
}

const NearbyShopsMap = ({ products, userLocation }) => {
  const [selectedShop, setSelectedShop] = useState(null);

  const center = userLocation || {
    lat: 17.385,
    lng: 78.486 // Secunderabad default
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg" style={{ border: '2px solid #fca5a5' }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        style={{ height: '500px', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* OpenStreetMap tiles with custom pink/red styling */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Recenter map when location changes */}
        <RecenterMap center={userLocation ? [center.lat, center.lng] : null} />

        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center p-2">
                <p className="font-bold" style={{ color: '#b91c1c' }}>📍 Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Shop markers */}
        {products.map((product) => {
          if (!product.profiles?.location_lat || !product.profiles?.location_lng) return null;

          return (
            <Marker
              key={product.id}
              position={[product.profiles.location_lat, product.profiles.location_lng]}
              icon={shopMarkerIcon}
              eventHandlers={{
                click: () => setSelectedShop(product),
              }}
            >
              <Popup maxWidth={300}>
                <div className="p-3">
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-bold text-lg mb-1" style={{ color: '#b91c1c' }}>
                    {product.name}
                  </h3>
                  <p className="text-sm mb-2" style={{ color: '#dc2626' }}>
                    {product.profiles?.full_name}
                  </p>
                  <p className="font-bold text-xl" style={{ color: '#ff5757' }}>
                    ${parseFloat(product.price).toFixed(2)}
                  </p>
                  {userLocation && product.profiles?.location_lat && (
                    <p className="text-xs mt-2 flex items-center" style={{ color: '#dc2626' }}>
                      <Navigation size={12} className="mr-1" />
                      {calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        product.profiles.location_lat,
                        product.profiles.location_lng
                      ).toFixed(1)} km away
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default NearbyShopsMap;