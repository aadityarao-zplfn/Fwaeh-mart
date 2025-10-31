import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import CustomerDashboardLayout from './components/dashboards/CustomerDashboardLayout';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />

          {/* Protected Customer Routes - Wrapped in CustomerDashboardLayout */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboardLayout>
                  <Cart />
                </CustomerDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboardLayout>
                  <Checkout />
                </CustomerDashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Dashboard - Role-based rendering inside */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;