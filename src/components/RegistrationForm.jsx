import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from 'react-hot-toast';
import { supabase } from "../lib/supabase";
import { generateAndSendOTP, verifyCustomOTP } from "../utils/otpService"; // 🆕 ADD verifyCustomOTP
import OTPModal from "./OTPModal";
import { LoadingSpinner, LoadingButton } from "../components/ui/LoadingSpinner";

export default function RegistrationForm() {
  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "",
    location: ""
  });

  // UI/UX states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State management for form submission/feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null); // 🆕 Store email for OTP verification

  const navigate = useNavigate();
  const { signUp } = useAuth();

  // Unified handleChange for all fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation: Check required fields
    if (!formData.fullName || !formData.email || !formData.password || 
        !formData.confirmPassword || !formData.role) {
      setError("Please fill in all required fields.");
      return;
    }

    // Validation: Name at least 3 characters
    if (formData.fullName.trim().length < 3) {
      setError("Name must be at least 3 characters long.");
      return;
    }

    // Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validation: Password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 8 characters, with an uppercase letter, lowercase letter, and a number.");
      return;
    }

    // Validation: Confirm password matches password
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validation: Role selected
    if (!formData.role || !["customer", "retailer", "wholesaler"].includes(formData.role)) {
      setError("Please select a valid role.");
      return;
    }

    setIsLoading(true);

    try {
      // 🆕 FIRST create Supabase user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      console.log('✅ User created in Supabase:', authData.user.id);

      // 🆕 Generate OTP with userId
      const otpResult = await generateAndSendOTP(formData.email, authData.user.id);
      
      if (!otpResult.success) {
        setError('Failed to generate OTP: ' + otpResult.error);
        setIsLoading(false);
        return;
      }

      // 🆕 Store user ID AND EMAIL for OTP verification
      setPendingUserId(authData.user.id);
      setPendingEmail(formData.email); // 🆕 CRITICAL: Store email for verification
      
      // 🆕 Store registration data temporarily
      sessionStorage.setItem('pendingRegistration', JSON.stringify({
        userId: authData.user.id,
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
        phone: formData.phone,
        location: formData.location
      }));

      setShowOTPModal(true);
      toast.success('OTP sent to your email! Please check your inbox.'); // 🆕 Updated message
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async (otpCode) => {
    try {
      console.log('🔄 Verifying OTP:', otpCode, 'for email:', pendingEmail);
      
      if (!pendingEmail) {
        throw new Error('Email not found for OTP verification');
      }

      // 1. Verify the OTP
      const verificationResult = await verifyCustomOTP(pendingEmail, otpCode, pendingUserId);
      
      if (!verificationResult.valid) {
        throw new Error(verificationResult.error || 'Invalid OTP');
      }

      console.log('✅ OTP verified successfully!');

      // 2. Retrieve user details from storage
      const storedData = sessionStorage.getItem('pendingRegistration');
      if (!storedData) {
        throw new Error('Registration data lost. Please try signing up again.');
      }
      const userData = JSON.parse(storedData);

      // 3. CREATE OR UPDATE THE USER PROFILE (Upsert fixes the 409 Conflict)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: pendingUserId,
            email: userData.email,
            full_name: userData.fullName,
            role: userData.role,
            phone: userData.phone || null,
            address: userData.location || null
          },
          // CRITICAL: onConflict tells Supabase to handle the duplicate ID silently
          { onConflict: 'id', ignoreDuplicates: false }
        );

      if (profileError) {
        console.error('Profile creation/update error:', profileError);
        throw new Error('Failed to create user profile');
      }

      // 4. Update Email Confirmation Status (Optional based on Supabase settings)
      // This is safe to keep now that the profile is created/updated
      await supabase.auth.updateUser({
        data: { email_confirmed_at: new Date().toISOString() }
      });

      setShowOTPModal(false);
      toast.success('Account created successfully! Welcome to Fwaeh Mart! 🎉');
      
      // Clean up
      sessionStorage.removeItem('pendingRegistration');
      setPendingUserId(null);
      setPendingEmail(null);
      
      // Redirect to Login
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'OTP verification failed. Please try again.');
      throw error; 
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      setError("");
  
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/select-role`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
  
      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
  
    } catch (err) {
      console.error('Google OAuth error:', err);
      setError('Google sign-up failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* OTP Modal */}
      {showOTPModal && (
        <OTPModal 
          onVerify={handleOTPVerify}
          email={formData.email}
          userId={pendingUserId}
          onClose={() => setShowOTPModal(false)}
        />
      )}

      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(135deg, #ffd4d4 0%, #ffb8be 50%, #ff9aa2 100%)",
        }}
      >
        {/* Full screen loading spinner */}
        {isLoading && <LoadingSpinner fullScreen={true} />}
        
        <div className="w-full max-w-md">
          <div
            className="rounded-2xl shadow-2xl p-8"
            style={{
              background: "linear-gradient(to bottom, #ffe8e8, #fff0f0)",
              border: "1px solid rgba(255, 130, 130, 0.3)",
            }}
          >
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #ff5757 0%, #ff8282 100%)",
                }}
              >
                <span className="text-3xl">🍰</span>
              </div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: "#b91c1c" }}>
                Create Account
              </h1>
              <p className="text-base" style={{ color: "#dc2626" }}>
                Sign up to get started
              </p>
            </div>

            {error && (
              <div className="flex items-center justify-between bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                <span className="block font-semibold">{error}</span>
                <button
                  type="button"
                  className="ml-4 text-xl font-bold leading-none focus:outline-none"
                  onClick={() => setError("")}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            )}

            <LoadingButton
              type="button"
              onClick={handleGoogleSignUp}
              loading={isLoading}
              className="w-full py-3 rounded-xl font-semibold transition-all border-2 shadow-sm hover:shadow-md mb-6"
              style={{
                background: '#fff5f5',
                borderColor: '#fca5a5',
                color: '#b91c1c'
              }}
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </div>
            </LoadingButton>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: '#fca5a5' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 text-sm" style={{ 
                  background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)',
                  color: '#dc2626'
                }}>
                  or sign up with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: "#b91c1c" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-3 rounded-xl border-2"
                  style={{
                    background: "#fff5f5",
                    borderColor: "#fca5a5",
                    color: "#b91c1c",
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: "#b91c1c" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-3 rounded-xl border-2"
                  style={{
                    background: "#fff5f5",
                    borderColor: "#fca5a5",
                    color: "#b91c1c",
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: "#b91c1c" }}>
                  Phone Number <span className="font-light">(optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-3 rounded-xl border-2"
                  style={{
                    background: "#fff5f5",
                    borderColor: "#fca5a5",
                    color: "#b91c1c",
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: "#b91c1c" }}>
                  Location <span className="font-light">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="City, Country"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-3 rounded-xl border-2"
                  style={{
                    background: "#fff5f5",
                    borderColor: "#fca5a5",
                    color: "#b91c1c",
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: "#b91c1c" }}>
                  Role <span className="font-light">(required)</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-3 rounded-xl border-2"
                  style={{
                    background: "#fff5f5",
                    borderColor: "#fca5a5",
                    color: "#b91c1c",
                  }}
                  required
                >
                  <option value="" disabled>Select role...</option>
                  <option value="customer">Customer</option>
                  <option value="retailer">Retailer</option>
                  <option value="wholesaler">Wholesaler</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: "#b91c1c" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border-2"
                    style={{
                      background: "#fff5f5",
                      borderColor: "#fca5a5",
                      color: "#b91c1c",
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#f87171" }}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: "#b91c1c" }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border-2"
                    style={{
                      background: "#fff5f5",
                      borderColor: "#fca5a5",
                      color: "#b91c1c",
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#f87171" }}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <LoadingButton
                type="submit"
                loading={isLoading}
                className="w-full py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #ff5757 0%, #ff8282 100%)",
                  color: "#ffffff",
                }}
              >
                Sign Up
              </LoadingButton>
            </form>

            <p className="text-center mt-6" style={{ color: "#dc2626" }}>
              Already have an account?{" "}
              <Link to="/login" className="font-bold hover:opacity-80" style={{ color: "#ff5757" }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}