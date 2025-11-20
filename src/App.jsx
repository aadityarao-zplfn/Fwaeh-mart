import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect, lazy, Suspense } from 'react';

// Lazy load components with proper error handling
const Products = lazy(() => import('./pages/Products').catch(err => {
  console.error('❌ Failed to load Products:', err);
  return { default: () => <div>❌ Products failed to load: {err.message}</div> };
}));

const Navbar = lazy(() => import('./components/Navbar').catch(err => {
  console.error('❌ Failed to load Navbar:', err);
  return { default: () => <div>❌ Navbar failed to load</div> };
}));

const Login = lazy(() => import('./pages/Login').catch(err => {
  console.error('❌ Failed to load Login:', err);
  return { default: () => <div>❌ Login failed to load</div> };
}));

// Safe component wrapper
const SafeComponent = ({ children, name, fallback = null }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  if (hasError) {
    return (
      <div style={{ padding: '20px', border: '2px solid red', margin: '10px' }}>
        <h3>❌ {name} Crashed</h3>
        <p>{error?.message}</p>
        <button onClick={() => setHasError(false)}>Retry</button>
      </div>
    );
  }

  try {
    return (
      <Suspense fallback={fallback || <div>⏳ Loading {name}...</div>}>
        {children}
      </Suspense>
    );
  } catch (error) {
    console.error(`❌ ${name} crashed:`, error);
    setError(error);
    setHasError(true);
    return null;
  }
};

// Loading component
const LoadingSpinner = () => (
  <div style={{ 
    padding: '50px', 
    textAlign: 'center',
    background: 'linear-gradient(to bottom, #f3d7d7, #f9e5e5)',
    minHeight: '100vh'
  }}>
    <h1 style={{ color: '#a94442' }}>Fwaeh Mart</h1>
    <p style={{ color: '#cd5c5c' }}>Loading...</p>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3d7d7',
      borderTop: '4px solid #e57373',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '20px auto'
    }}></div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  console.log('🚀 APP.JSX RENDERED - App is starting...');

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
      
      {/* Debug Banner */}
      <div style={{ 
        padding: '10px', 
        background: '#10b981', 
        color: 'white',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        ✅ DEBUG: App.jsx loaded successfully
      </div>

      <SafeComponent name="AuthProvider" fallback={<LoadingSpinner />}>
        <AuthProvider>
          <SafeComponent name="BrowserRouter" fallback={<LoadingSpinner />}>
            <BrowserRouter>
              <SafeComponent name="Navbar" fallback={<div>Loading Navbar...</div>}>
                <Navbar />
              </SafeComponent>
              
              {/* Routes Section */}
              <div style={{ 
                padding: '10px', 
                background: '#e0e0e0',
                textAlign: 'center',
                fontSize: '12px'
              }}>
                🚀 Routes section loading...
              </div>

              <Routes>
                {/* Test Route - Always works */}
                <Route 
                  path="/test" 
                  element={
                    <div style={{ 
                      padding: '50px', 
                      textAlign: 'center',
                      background: 'linear-gradient(to bottom, #f3d7d7, #f9e5e5)',
                      minHeight: '100vh'
                    }}>
                      <h1 style={{ color: '#a94442' }}>✅ TEST ROUTE WORKS!</h1>
                      <p style={{ color: '#cd5c5c' }}>React Router is functioning correctly</p>
                      <button 
                        onClick={() => window.location.href = '/'}
                        style={{
                          padding: '12px 24px',
                          background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          margin: '10px'
                        }}
                      >
                        Go to Home
                      </button>
                    </div>
                  } 
                />

                {/* Home Route with Products */}
                <Route 
                  path="/" 
                  element={
                    <SafeComponent name="Products" fallback={<LoadingSpinner />}>
                      <Products />
                    </SafeComponent>
                  } 
                />

                {/* Simple Login Route */}
                <Route 
                  path="/login" 
                  element={
                    <SafeComponent name="Login" fallback={<LoadingSpinner />}>
                      <Login />
                    </SafeComponent>
                  } 
                />

                {/* Fallback route */}
                <Route 
                  path="*" 
                  element={
                    <div style={{ 
                      padding: '50px', 
                      textAlign: 'center',
                      background: 'linear-gradient(to bottom, #f3d7d7, #f9e5e5)',
                      minHeight: '100vh'
                    }}>
                      <h1 style={{ color: '#a94442' }}>🔄 Route Not Found</h1>
                      <p style={{ color: '#cd5c5c' }}>Path: {window.location.pathname}</p>
                      <button 
                        onClick={() => window.location.href = '/test'}
                        style={{
                          padding: '12px 24px',
                          background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          margin: '10px'
                        }}
                      >
                        Test Routing
                      </button>
                    </div>
                  } 
                />
              </Routes>
            </BrowserRouter>
          </SafeComponent>
        </AuthProvider>
      </SafeComponent>
    </>
  );
}

export default App;
