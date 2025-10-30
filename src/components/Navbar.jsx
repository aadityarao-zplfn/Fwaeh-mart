import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              Fwaeh-mart
            </Link>
            {user && (
              <div className="hidden md:flex space-x-4">
                <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
                  Products
                </Link>
                <Link to="/cart" className="text-gray-700 hover:text-primary-600 transition-colors">
                  Cart
                </Link>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
                  Dashboard
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  {profile?.full_name}
                  <span className="ml-2 text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                    {profile?.role}
                  </span>
                </span>
                <button onClick={handleSignOut} className="btn-secondary">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
