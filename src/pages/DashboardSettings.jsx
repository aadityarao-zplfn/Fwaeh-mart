import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LocationPicker from '../components/LocationPicker';
import { Save, Store } from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardSettings = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location_lat: null,
    location_lng: null,
    location_address: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        location_lat: profile.location_lat,
        location_lng: profile.location_lng,
        location_address: profile.location_address || ''
      });
    }
  }, [profile]);

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      location_lat: locationData.lat,
      location_lng: locationData.lng,
      location_address: locationData.address || prev.location_address
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          location_lat: formData.location_lat,
          location_lng: formData.location_lng,
          location_address: formData.location_address,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Shop settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#b91c1c' }}>Shop Settings</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-md border border-red-100">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Shop Name / Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-200 outline-none"
              />
            </div>
          </div>

          {/* Location Picker */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
              <Store size={20} className="mr-2 text-red-500" />
              Shop Location
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Pin your shop on the map. This allows customers to find you using distance filters.
            </p>
            
            <LocationPicker 
              initialLocation={
                formData.location_lat 
                  ? { lat: formData.location_lat, lng: formData.location_lng } 
                  : null
              }
              onLocationSelect={handleLocationSelect}
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
          >
            {loading ? 'Saving...' : (
              <>
                <Save size={20} className="mr-2" />
                Save Settings
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DashboardSettings;