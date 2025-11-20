import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';

// Import components with error boundaries
const SafeComponent = ({ children, name }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div style={{ padding: '20px', border: '2px solid red', margin: '10px' }}>
        <h3>❌ {name} Failed to Load</h3>
        <button onClick={() => setHasError(false)}>Retry</button>
      </div>
    );
  }

  try {
    return children;
  } catch (error) {
    console.error(`❌ ${name} crashed:`, error);
    setHasError(true);
    return null;
  }
};

// Lazy load components with error handling
const Navbar = () => {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    import('./components/Navbar')
      .then(module => setComponent(() => module.default))
      .catch(err => {
        console.error('❌ Failed to load Navbar:', err);
        setError(err);
      });
  }, []);

  if (error) return <div>❌ Navbar failed to load</div>;
  if (!Component) return <div>⏳ Loading Navbar...</div>;
  return <Component />;
};

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
      
      <div style={{ padding: '10px', background: '#f0f0f0', borderBottom: '2px solid red' }}>
        <strong>🔍 DEBUG MODE:</strong> App.jsx loaded successfully
      </div>

      <SafeComponent name="AuthProvider">
        <AuthProvider>
          <SafeComponent name="BrowserRouter">
            <BrowserRouter>
              <SafeComponent name="Navbar">
                <Navbar />
              </SafeComponent>
              
              <div style={{ padding: '10px', background: '#e0e0e0' }}>
                <strong>Routes are loading...</strong>
              </div>

              <Routes>
                {/* Simple test route */}
                <Route 
                  path="/test" 
                  element={
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                      <h1>✅ TEST ROUTE WORKS!</h1>
                      <p>If you see this, routing is working</p>
                    </div>
                  } 
                />

                {/* Public Routes with error boundaries */}
                <Route 
                  path="/" 
                  element={
                    <SafeComponent name="Products">
                      {(() => {
                        try {
                          const Products = require('./pages/Products').default;
                          return <Products />;
                        } catch (error) {
                          console.error('❌ Products page crashed:', error);
                          return (
                            <div style={{ padding: '50px', textAlign: 'center' }}>
                              <h1>❌ Products Page Failed</h1>
                              <p>{error.message}</p>
                            </div>
                          );
                        }
                      })()}
                    </SafeComponent>
                  } 
                />

                {/* Fallback route to test if routing works at all */}
                <Route 
                  path="*" 
                  element={
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                      <h1>🔄 React Router is Working!</h1>
                      <p>But the specific route wasn't found.</p>
                      <p>Current path: {window.location.pathname}</p>
                      <button onClick={() => window.location.href = '/test'}>
                        Go to Test Route
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
