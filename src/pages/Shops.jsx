import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateDistance, formatDistance } from '../utils/location';
import NearbyShopsMap from '../components/NearbyShopsMap';
import { Search, MapPin, Store, Phone, Navigation } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const Shops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // 1. Get User Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => console.log("Location access denied")
      );
    }
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      // Fetch retailers and wholesalers who have set a location
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone, address, location_lat, location_lng, location_address')
        .in('role', ['retailer', 'wholesaler'])
        .not('location_lat', 'is', null);

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distances and sort
  const sortedShops = shops
    .map(shop => {
      const dist = userLocation 
        ? calculateDistance(userLocation.lat, userLocation.lng, shop.location_lat, shop.location_lng)
        : null;
      return { ...shop, distance: dist };
    })
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
    .filter(shop => 
      shop.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.location_address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#fdf2f8' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#b91c1c' }}>Nearby Shops</h1>
          <p style={{ color: '#db2777' }}>Find local retailers and wholesalers near you</p>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by shop name or area..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Map View */}
        {userLocation && sortedShops.length > 0 && (
            <div className="mb-8 h-[400px] rounded-2xl overflow-hidden shadow-lg border-2 border-pink-200">
                <NearbyShopsMap 
                    products={sortedShops.map(s => ({ 
                        id: s.id,
                        name: s.full_name, 
                        price: 0, 
                        image_url: null,
                        profiles: s 
                    }))} 
                    userLocation={userLocation} 
                />
            </div>
        )}

        {/* Shop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedShops.map((shop) => (
            <div key={shop.id} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border border-pink-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{shop.full_name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    shop.role === 'wholesaler' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'
                  }`}>
                    {shop.role.toUpperCase()}
                  </span>
                </div>
                {shop.distance !== null && (
                  <div className="flex items-center text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg">
                    <Navigation size={16} className="mr-1" />
                    {formatDistance(shop.distance)}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-gray-600 text-sm">
                <p className="flex items-start">
                  <MapPin size={16} className="mr-2 mt-1 flex-shrink-0 text-pink-500" />
                  {shop.location_address || 'Address not available'}
                </p>
                {shop.phone && (
                  <p className="flex items-center">
                    <Phone size={16} className="mr-2 text-pink-500" />
                    {shop.phone}
                  </p>
                )}
              </div>

              <button 
                onClick={() => window.open(`https://www.openstreetmap.org/directions?to=${shop.location_lat},${shop.location_lng}`, '_blank')}
                className="mt-4 w-full py-2 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
              >
                <Navigation size={18} className="mr-2" />
                Get Directions
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shops;