import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import RoleSelection from './pages/Roleselection'; // NEW
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import CustomerDashboardLayout from './components/dashboards/CustomerDashboardLayout';

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Products />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />

            {/* NEW: Role Selection (requires auth but not role) */}
            <Route
              path="/select-role"
              element={
                <ProtectedRoute requireRole={false}>
                  <RoleSelection />
                </ProtectedRoute>
              }
            />

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
    </>
  );
}


export default App; 


