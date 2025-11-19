import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function RoleSelection() {
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // 🆕 CRITICAL FIX: Wait for profile to load and redirect if already has role
  useEffect(() => {
    if (!loading && profile?.role) {
      navigate('/dashboard');
    }
  }, [profile, loading, navigate]);

  // 🆕 Show loading while checking auth state
  if (loading || (user && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 🆕 If profile exists and has role, don't render anything (will redirect)
  if (profile?.role) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!role) {
      setError("Please select a role");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (!user) {
        setError("No user found. Please log in again.");
        setIsLoading(false);
        navigate('/login');
        return;
      }

      // Update the user's profile with selected role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: role })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #ffd4d4 0%, #ffb8be 50%, #ff9aa2 100%)",
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
                background: "linear-gradient(135deg, #ff5757 0%, #ff8282 100%)",
              }}
            >
              <span className="text-3xl">🎯</span>
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: "#b91c1c" }}>
              Select Your Role
            </h1>
            <p className="text-base" style={{ color: "#dc2626" }}>
              Choose how you'll use Fwaeh Mart
            </p>
          </div>

          {error && (
            <div className="flex items-center justify-between bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <span className="block font-semibold">{error}</span>
              <button
                type="button"
                className="ml-4 text-xl font-bold leading-none focus:outline-none"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                  role === "customer" ? "shadow-lg scale-105" : "hover:shadow-md hover:scale-102"
                }`}
                style={{
                  background: role === "customer" ? "#ffe8e8" : "#fff5f5",
                  borderColor: role === "customer" ? "#ff5757" : "#fca5a5",
                  color: "#b91c1c",
                }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-3xl mr-4">🛍️</div>
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1">Customer</div>
                    <div className="text-sm opacity-75">Browse and purchase products from retailers and wholesalers</div>
                  </div>
                  {role === "customer" && (
                    <div className="flex-shrink-0 text-2xl">✓</div>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("retailer")}
                className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                  role === "retailer" ? "shadow-lg scale-105" : "hover:shadow-md hover:scale-102"
                }`}
                style={{
                  background: role === "retailer" ? "#ffe8e8" : "#fff5f5",
                  borderColor: role === "retailer" ? "#ff5757" : "#fca5a5",
                  color: "#b91c1c",
                }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-3xl mr-4">🏪</div>
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1">Retailer</div>
                    <div className="text-sm opacity-75">Sell products directly to customers</div>
                  </div>
                  {role === "retailer" && (
                    <div className="flex-shrink-0 text-2xl">✓</div>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("wholesaler")}
                className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                  role === "wholesaler" ? "shadow-lg scale-105" : "hover:shadow-md hover:scale-102"
                }`}
                style={{
                  background: role === "wholesaler" ? "#ffe8e8" : "#fff5f5",
                  borderColor: role === "wholesaler" ? "#ff5757" : "#fca5a5",
                  color: "#b91c1c",
                }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-3xl mr-4">🏭</div>
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1">Wholesaler</div>
                    <div className="text-sm opacity-75">Supply products in bulk to retailers</div>
                  </div>
                  {role === "wholesaler" && (
                    <div className="flex-shrink-0 text-2xl">✓</div>
                  )}
                </div>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !role}
              className="w-full py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #ff5757 0%, #ff8282 100%)",
                color: "#ffffff",
              }}
            >
              {isLoading ? "Saving..." : "Continue to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 