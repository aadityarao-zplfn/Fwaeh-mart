import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Crosshair } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map clicks and updates
const LocationMarker = ({ position, setPosition, setAddress, onLocationSelect }) => {
  const map = useMap();

  const mapEvents = useMapEvents({
    click(e) {
      const newPos = e.latlng;
      setPosition(newPos);
      map.flyTo(newPos, map.getZoom());
      fetchAddress(newPos.lat, newPos.lng, setAddress, onLocationSelect);
    },
  });

  // Fly to position if it changes externally (e.g. "Use Current Location" button)
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

// Helper to reverse geocode (get address from lat/lng)
const fetchAddress = async (lat, lng, setAddress, onLocationSelect) => {
  try {
    // Notify parent immediately of coords
    onLocationSelect({ lat, lng, address: "Fetching address..." });
    
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await response.json();
    
    if (data.display_name) {
      setAddress(data.display_name);
      // Update parent with final address
      onLocationSelect({ lat, lng, address: data.display_name });
    }
  } catch (error) {
    console.error("Error fetching address:", error);
    onLocationSelect({ lat, lng, address: "Address lookup failed" });
  }
};

const LocationPicker = ({ initialLocation, onLocationSelect }) => {
  const [position, setPosition] = useState(initialLocation || null);
  const [address, setAddress] = useState('');

  // Initialize if prop provided
  useEffect(() => {
    if (initialLocation && initialLocation.lat && initialLocation.lng) {
      setPosition(initialLocation);
    }
  }, [initialLocation]);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(newPos);
        fetchAddress(newPos.lat, newPos.lng, setAddress, onLocationSelect);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-bold text-gray-700">
          <MapPin size={16} className="inline mr-1" /> 
          Pin Shop Location
        </label>
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="text-sm text-blue-600 hover:underline flex items-center"
        >
          <Crosshair size={16} className="mr-1" />
          Use Current Location
        </button>
      </div>

      <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 border-gray-300 relative z-0">
        <MapContainer 
          center={position || { lat: 17.385, lng: 78.486 }} // Default to Secunderabad
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            setAddress={setAddress}
            onLocationSelect={onLocationSelect}
          />
        </MapContainer>
      </div>

      {(address || (position && position.lat)) && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
          {address ? (
            <><strong>Selected Address:</strong> {address}</>
          ) : (
            <><strong>Coordinates:</strong> {position.lat.toFixed(5)}, {position.lng.toFixed(5)}</>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;