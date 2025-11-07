import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

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
      // Call the signUp function from AuthContext
      const { error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.role
      );

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      alert("Registration successful! Please check your email to verify your account.");
      navigate('/login');

    } catch (err) {
      setError(err.message || "An error occurred during registration.");
      setIsLoading(false);
    }
  };

  // ✅ NEW: Google OAuth Handler (Frontend Only - Backend integration pending)
  const handleGoogleSignUp = async () => {
    try {
      // This is a placeholder for Google OAuth
      // Your friend will integrate this with Supabase later
      console.log("Google OAuth button clicked - Backend integration pending");
      
      // For now, show a message to the user
      alert("Google Sign-Up feature is coming soon! Please use email registration for now.");
      
      // When backend is ready, this will be replaced with:
      // const { data, error } = await supabase.auth.signInWithOAuth({
      //   provider: 'google',
      //   options: {
      //     redirectTo: `${window.location.origin}/dashboard`,
      //   }
      // });
    } catch (err) {
      setError('Google sign-up is not available yet. Please use email registration.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #ffd4d4 0%, #ffb8be 50%, #ff9aa2 100%)",
      }}
    >
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
                background:
                  "linear-gradient(135deg, #ff5757 0%, #ff8282 100%)",
              }}
            >
              <span className="text-3xl">🍰</span>
            </div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ color: "#b91c1c" }}
            >
              Create Account
            </h1>
            <p className="text-base" style={{ color: "#dc2626" }}>
              Sign up to get started
            </p>
          </div>

          {/* Alert messages */}
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

          {/* ✅ NEW: Google Sign-Up Button (placed BEFORE the form) */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full py-3 rounded-xl font-semibold transition-all border-2 shadow-sm hover:shadow-md mb-6"
            style={{
              background: '#fff5f5',
              borderColor: '#fca5a5',
              color: '#b91c1c'
            }}
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </div>
          </button>

          {/* ✅ NEW: Divider */}
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
              <label
                className="block text-sm font-semibold"
                style={{ color: "#b91c1c" }}
              >
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
              <label
                className="block text-sm font-semibold"
                style={{ color: "#b91c1c" }}
              >
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
              <label
                className="block text-sm font-semibold"
                style={{ color: "#b91c1c" }}
              >
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
              <label
                className="block text-sm font-semibold"
                style={{ color: "#b91c1c" }}
              >
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
              <label
                className="block text-sm font-semibold"
                style={{ color: "#b91c1c" }}
              >
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
                <option value="" disabled>
                  Select role...
                </option>
                <option value="customer">Customer</option>
                <option value="retailer">Retailer</option>
                <option value="wholesaler">Wholesaler</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="block text-sm font-semibold"
                style={{ color: "#b91c1c" }}
              >
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
              <label
                className="block text-sm font-semibold"
                style={{ color: "#b91c1c" }}
              >
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, #ff5757 0%, #ff8282 100%)",
                color: "#ffffff",
              }}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center mt-6" style={{ color: "#dc2626" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold hover:opacity-80"
              style={{ color: "#ff5757" }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}