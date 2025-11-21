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
import RetailerDashboardLayout from './components/dashboards/RetailerDashboardLayout';
import WholesalerDashboardLayout from './components/dashboards/WholesalerDashboardLayout';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import PaymentHistory from './pages/PaymentHistory';
import Profile from './pages/Profile';
import DashboardSettings from './pages/DashboardSettings';
import Shops from './pages/Shops';
import PaymentsPending from './pages/PaymentsPending';
import ShippingStatus from './pages/ShippingStatus';
import CustomerDashboard from './components/CustomerDashboard';
import CustomerOrderHistory from './components/dashboards/CustomerOrderHistory'; // ✅ NEW IMPORT

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
            <Route path="/shops" element={<Shops />} />

            {/* Role Selection */}
            <Route
              path="/select-role"
              element={
                <ProtectedRoute requireRole={false}>
                  <RoleSelection />
                </ProtectedRoute>
              }
            />

            {/* Customer Routes */}
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
            {/* Order History Route - FIXED */}
            <Route
              path="/dashboard/orders"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboardLayout>
                    <CustomerOrderHistory />
                  </CustomerDashboardLayout>
                </ProtectedRoute>
              }
            />
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

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Retailer Settings */}
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute allowedRoles={['retailer']}>
                  <RetailerDashboardLayout>
                    <DashboardSettings />
                  </RetailerDashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Wholesaler Settings */}
             <Route
              path="/wholesaler/settings"
              element={
                <ProtectedRoute allowedRoles={['wholesaler']}>
                  <WholesalerDashboardLayout>
                    <DashboardSettings />
                  </WholesalerDashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Retailer Payments (Case 3) */}
              <Route path="/dashboard/payments" element={
                <ProtectedRoute allowedRoles={['retailer']}>
                  <RetailerDashboardLayout><PaymentsPending /></RetailerDashboardLayout>
                </ProtectedRoute>
              } 
            />

            {/* Retailer Shipping */}
              <Route path="/dashboard/shipping" element={
                <ProtectedRoute allowedRoles={['retailer']}>
                  <RetailerDashboardLayout><ShippingStatus /></RetailerDashboardLayout>
                </ProtectedRoute>
              } 
              />   

              {/* Wholesaler Shipping */}
              <Route path="/wholesaler/shipping" element={
                <ProtectedRoute allowedRoles={['wholesaler']}>
                  <WholesalerDashboardLayout><ShippingStatus /></WholesalerDashboardLayout>
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