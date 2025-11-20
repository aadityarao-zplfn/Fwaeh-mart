import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import RoleSelection from './pages/Roleselection';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import OrderTracking from './pages/OrderTracking';
import CustomerDashboardLayout from './components/dashboards/CustomerDashboardLayout';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import PaymentHistory from './pages/PaymentHistory';
import Profile from './pages/Profile';

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

            {/* Role Selection (requires auth but not role) */}
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
            <Route path="/profile" element={<Profile />} />

            
            {/* Order Tracking Route */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboardLayout>
                    <OrderTracking />
                  </CustomerDashboardLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Payment Route - Added CustomerDashboardLayout */}
            <Route
              path="/payment"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboardLayout>
                    <Payment />
                  </CustomerDashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-failure" element={<PaymentFailure />} />

            {/* Dashboard - Role-based rendering inside */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-history"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboardLayout>
                    <PaymentHistory />
                  </CustomerDashboardLayout>
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
