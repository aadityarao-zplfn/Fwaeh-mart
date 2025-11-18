import { User, Mail, MapPin, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

const Profile = () => {
  const { user, profile, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fde8e8' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#a73636' }}></div>
          <p className="mt-4" style={{ color: '#a73636' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error if no user is logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fde8e8' }}>
        <div className="text-center">
          <p style={{ color: '#a73636' }}>Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  // Get the actual user data from AuthContext
  const userData = {
    name: profile?.full_name || 
          user.user_metadata?.full_name || 
          user.user_metadata?.name || 
          user.email?.split('@')[0] || // Use email username as fallback
          'User',
    email: user.email || 'No email provided',
    phone: profile?.phone || user.user_metadata?.phone || 'Not provided',
    address: profile?.address || user.user_metadata?.address || 'Not provided',
  };

  return (
    <div className="min-h-screen" style={{ background: '#fde8e8' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ background: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              style={{ color: '#a73636' }}
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-2xl font-bold" style={{ color: '#a73636' }}>
              Fwaeh Mart
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#a73636' }}>
            My Profile
          </h2>
          <p style={{ color: '#b94a4a' }}>
            Your account information
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl shadow-md p-8" style={{ background: '#ffffff' }}>
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: '#ffe5e5', border: '4px solid #e89999' }}
              >
                <User size={64} style={{ color: '#e89999' }} />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mt-4" style={{ color: '#a73636' }}>
              {userData.name}
            </h3>
            <p className="text-sm mt-1" style={{ color: '#b94a4a' }}>
              {userData.email}
            </p>
          </div>

          {/* Profile Fields */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#a73636' }}>
                <User size={16} />
                Full Name
              </label>
              <p className="px-4 py-3 rounded-xl" style={{ background: '#fafafa', color: '#a73636' }}>
                {userData.name}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#a73636' }}>
                <Mail size={16} />
                Email Address
              </label>
              <p className="px-4 py-3 rounded-xl" style={{ background: '#fafafa', color: '#a73636' }}>
                {userData.email}
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#a73636' }}>
                <Phone size={16} />
                Phone Number
              </label>
              <p className="px-4 py-3 rounded-xl" style={{ background: '#fafafa', color: '#a73636' }}>
                {userData.phone}
              </p>
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#a73636' }}>
                <MapPin size={16} />
                Address
              </label>
              <p className="px-4 py-3 rounded-xl" style={{ background: '#fafafa', color: '#a73636' }}>
                {userData.address}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;