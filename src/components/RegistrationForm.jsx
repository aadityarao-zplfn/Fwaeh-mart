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
  const { signUp } = useAuth(); // ✅ GET signUp FROM CONTEXT

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

    // ✅ ALL VALIDATIONS PASSED - NOW CALL SUPABASE
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

      // ✅ SUCCESS!
      alert("Registration successful! Please check your email to verify your account.");
      navigate('/login');

    } catch (err) {
      setError(err.message || "An error occurred during registration.");
      setIsLoading(false);
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

          <form onSubmit={handleSubmit} className="space-y-5">
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