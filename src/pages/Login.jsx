import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // ADD useNavigate
import { supabase } from "../lib/supabase"; // ADD THIS IMPORT

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate(); // ADD THIS

  // REPLACE the handleSubmit function with this:
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation (keep her existing validation)
    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    // SUPABASE INTEGRATION STARTS HERE
    setIsLoading(true);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      // Success!
      setSuccess(true);
      setIsLoading(false);
      
      // Navigate to dashboard after successful login
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);

    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  // ADD THIS NEW FUNCTION for Google OAuth
  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          // If you want to persist session
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        setError(error.message);
      }
      // Supabase will redirect automatically on success
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #ffd4d4 0%, #ffb8be 50%, #ff9aa2 100%)'
    }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl shadow-2xl p-8" style={{
          background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)',
          border: '1px solid rgba(255, 130, 130, 0.3)'
        }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg" style={{
              background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)'
            }}>
              <span className="text-3xl">🍓</span>
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#b91c1c' }}>
              Welcome Back
            </h1>
            <p className="text-base" style={{ color: '#dc2626' }}>
              Sign in to your account
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-400 text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 border border-green-400 text-green-700">
              Login successful! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5"> {/* WRAP IN FORM TAG */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold" style={{ color: '#b91c1c' }}>
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#f87171' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 outline-none transition-all duration-200 ease-in-out group-hover:scale-[1.03] group-hover:shadow-md"
                  style={{
                    background: '#fff5f5',
                    borderColor: '#fca5a5',
                    color: '#b91c1c'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ff5757'}
                  onBlur={(e) => e.target.style.borderColor = '#fca5a5'}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold" style={{ color: '#b91c1c' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#f87171' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border-2 transition-all outline-none"
                  style={{
                    background: '#fff5f5',
                    borderColor: '#fca5a5',
                    color: '#b91c1c'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ff5757'}
                  onBlur={(e) => e.target.style.borderColor = '#fca5a5'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#f87171' }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" x2="23" y1="1" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: '#ff5757' }}
                />
                <label htmlFor="remember" className="text-sm cursor-pointer" style={{ color: '#dc2626' }}>
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm font-semibold transition-colors hover:opacity-80" style={{ color: '#ff5757' }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)',
                color: '#ffffff'
              }}
            >
              {isLoading ? (
                <span className="flex justify-center items-center gap-2">
                  <span
                    className="w-5 h-5 border-2 border-t-2 border-t-[#ff5757] border-[#ffe8e8] rounded-full animate-spin"
                    style={{ display: "inline-block" }}
                  ></span>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form> {/* CLOSE FORM TAG */}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#fca5a5' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 text-sm" style={{ 
                background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)',
                color: '#dc2626'
              }}>
                or continue with
              </span>
            </div>
          </div>

          {/* ADD onClick to Google button */}
          <button
            type="button"
            onClick={handleGoogleLogin} // ADD THIS
            className="w-full py-3 rounded-xl font-semibold transition-all border-2 shadow-sm hover:shadow-md"
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
              Sign in with Google
            </div>
          </button>

          <p className="text-center mt-6" style={{ color: '#dc2626' }}>
            Don't have an account?{" "}
            <Link to="/register" className="font-bold transition-colors hover:opacity-80" style={{ color: '#ff5757' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}