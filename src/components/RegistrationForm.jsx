import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OTPModal from "./OTPModal";

export default function RegistrationForm() {
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(""); // now must be one of customer/retailer/wholesaler
  const [location, setLocation] = useState("");

  // UI/UX states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State management for form submission/feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // OTP Modal State
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const navigate = useNavigate();

  // Unified handleChange for all fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case "name":
        setName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
      case "phone":
        setPhone(value);
        break;
      case "role":
        setRole(value);
        break;
      case "location":
        setLocation(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation: Check required fields
    if (!name || !email || !password || !confirmPassword || !role || !phone || !location) {
      setError("Please fill in all required fields.");
      return;
    }

    // Validation: Name at least 3 characters
    if (name.trim().length < 3) {
      setError("Name must be at least 3 characters long.");
      return;
    }

    // Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validation: Password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Password must be at least 8 characters, with an uppercase letter, lowercase letter, and a number.");
      return;
    }

    // Validation: Confirm password matches password
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validation: Phone - exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    // Validation: Role selected
    if (!role || !["customer", "retailer", "wholesaler"].includes(role)) {
      setError("Please select a role (customer, retailer, wholesaler).");
      return;
    }

    // Validation: Location not empty
    if (!location.trim()) {
      setError("Location cannot be empty.");
      return;
    }

    // All validations passed, proceed
    setLoading(true);
    try {
      // Simulate submission: Log form data
      console.log({
        name,
        email,
        password,
        confirmPassword,
        phone,
        role,
        location
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUserEmail(email);
      setShowOTPModal(true);
      setSuccess(true);
    } catch (err) {
      setError("An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otp) => {
    // (Demo) handle OTP correctly here
    setShowOTPModal(false);
    alert("OTP Verified! Code: " + otp);
  };

  return (
    <>
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
              {/* Alert messages at the very beginning of the form */}
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
              {success && (
                <div className="flex items-center justify-between bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                  <span className="block font-semibold">Registration successful!</span>
                  <button
                    type="button"
                    className="ml-4 text-xl font-bold leading-none focus:outline-none"
                    onClick={() => setSuccess(false)}
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
                  name="name"
                  value={name}
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
                  value={email}
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
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  name="phone"
                  value={phone}
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
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City, Country"
                  name="location"
                  value={location}
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
                  Role <span className="font-light">(must be selected)</span>
                </label>
                <select
                  name="role"
                  value={role}
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
                    value={password}
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
                    value={confirmPassword}
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

              {/* Previous error/success display removed from here */}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(135deg, #ff5757 0%, #ff8282 100%)",
                  color: "#ffffff",
                }}
              >
                {loading ? "Creating Account..." : "Sign Up"}
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

      {showOTPModal && (
        <OTPModal email={userEmail} onVerify={handleOTPVerify} />
      )}
    </>
  );
}