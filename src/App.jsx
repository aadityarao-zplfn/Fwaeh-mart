import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';

function App() {
  // Test Supabase connection on app load
  useEffect(() => {
    const testSupabaseConnection = async () => {
      console.log('🔄 Testing Supabase connection...');
      
      try {
        // Test 1: Check if Supabase client is initialized
        if (!supabase) {
          console.error('❌ Supabase client not initialized');
          return;
        }
        console.log('✅ Supabase client initialized');

        // Test 2: Try to query profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        
        if (error) {
          console.log('⚠️ Query error (table might be empty or not exist yet):', error.message);
          console.log('Error code:', error.code);
          
          // If table doesn't exist, that's expected before migrations
          if (error.code === '42P01') {
            console.log('ℹ️ profiles table not found - need to run migrations');
          }
        } else {
          console.log('✅ Supabase connected successfully!');
          console.log('📊 Database is working!');
          console.log('Data:', data);
        }

        // Test 3: Check authentication status
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('✅ User is logged in:', session.user.email);
        } else {
          console.log('ℹ️ No active session (user not logged in)');
        }

      } catch (err) {
        console.error('❌ Supabase connection test failed:', err);
      }
    };

    testSupabaseConnection();
  }, []); // Run once on mount

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
