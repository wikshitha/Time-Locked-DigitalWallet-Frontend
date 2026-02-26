import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useNavigate, Link } from "react-router-dom";
import { FaLock, FaShieldAlt, FaKey, FaFingerprint, FaUserPlus, FaFileAlt, FaEnvelope, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Zustand store values & actions
  const { login, loading, error } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password }); // handled by Zustand store
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#000957] via-[#000957] to-[#344cb7] animate-gradient-shift"></div>
      
      {/* Floating animated shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#ffeb00]/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#000957]/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#ffeb00]/5 rounded-full blur-2xl animate-pulse"></div>
      </div>

      {/* Animated Floating Icons with React Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Lock Icons */}
        <div className="absolute top-20 left-1/4 animate-float opacity-20">
          <FaLock className="w-12 h-12 text-[#ffeb00]" />
        </div>
        <div className="absolute bottom-32 right-1/4 animate-float-delayed opacity-15">
          <FaLock className="w-16 h-16 text-white" />
        </div>
        
        {/* Shield Icons */}
        <div className="absolute top-1/3 right-20 animate-float opacity-25">
          <FaShieldAlt className="w-14 h-14 text-[#ffeb00]" />
        </div>
        
        {/* Key Icons */}
        <div className="absolute bottom-1/4 left-16 animate-float-delayed opacity-20">
          <FaKey className="w-10 h-10 text-white" />
        </div>
        <div className="absolute top-40 right-32 animate-float opacity-15">
          <FaKey className="w-12 h-12 text-[#ffeb00]" />
        </div>

        {/* Fingerprint Icons */}
        <div className="absolute top-1/2 left-10 animate-float opacity-10">
          <FaFingerprint className="w-16 h-16 text-white" />
        </div>

        {/* Sparkle effects */}
        <div className="absolute top-10 left-1/2 animate-ping opacity-30">
          <HiSparkles className="w-4 h-4 text-[#ffeb00]" />
        </div>
        <div className="absolute bottom-10 right-1/3 animate-ping opacity-40" style={{animationDelay: '1s'}}>
          <HiSparkles className="w-5 h-5 text-white" />
        </div>
        <div className="absolute top-1/4 right-10 animate-ping opacity-25" style={{animationDelay: '2s'}}>
          <HiSparkles className="w-4 h-4 text-[#ffeb00]" />
        </div>
      </div>

      {/* Geometric patterns */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{ 
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,235,0,0.1) 10px, rgba(255,235,0,0.1) 20px)` 
          }}>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Glass morphism card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-10 hover:shadow-[0_0_40px_rgba(255,235,0,0.3)] transition-all duration-500">
          {/* Logo */}
          <div className="flex justify-center mb-4 animate-bounce-slow">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="LegacyLock Logo" 
                className="w-24 h-24 object-contain drop-shadow-2xl transform hover:scale-110 hover:rotate-6 transition-all duration-500"
              />
            </div>
          </div>

          {/* Brand Name */}
          <div className="text-center mb-4 relative">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white via-[#ffeb00] to-white bg-clip-text text-transparent animate-gradient-text tracking-wider">
              LegacyLock
            </h2>
            {/* Decorative elements */}
            <div className="flex justify-center items-center gap-2 mt-2">
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-[#ffeb00] animate-expand"></div>
              <FaLock className="w-4 h-4 text-[#ffeb00] animate-pulse" />
              <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-[#ffeb00] animate-expand"></div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-white via-[#ffeb00] to-white bg-clip-text text-transparent mb-2 animate-gradient-text">
            Welcome Back
          </h1>
          <p className="text-center text-white/90 mb-8 text-sm">
            Sign in to access your secure digital vault
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-xl backdrop-blur-sm animate-shake">
              <p className="text-white text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div className="relative group">
              <label className="text-white/95 text-sm font-semibold mb-2 block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-[#ffeb00]" />
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ffeb00] focus:bg-white/10 transition-all duration-300 hover:border-white/30"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative group">
              <label className="text-white/95 text-sm font-semibold mb-2 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-[#ffeb00]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ffeb00] focus:bg-white/10 transition-all duration-300 hover:border-white/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center group"
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-white/50 group-hover:text-[#ffeb00] transition-colors" />
                  ) : (
                    <FaEye className="h-5 w-5 text-white/50 group-hover:text-[#ffeb00] transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-[#000957] shadow-lg transform transition-all duration-300 ${
                loading
                  ? "bg-white/20 cursor-not-allowed text-white"
                  : "bg-gradient-to-r from-[#ffeb00] to-[#ffd700] hover:from-[#ffd700] hover:to-[#ffeb00] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,235,0,0.5)] active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <FaArrowRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-white/80">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-[#ffeb00] font-bold hover:text-white transition-colors duration-300 hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm flex items-center justify-center gap-2">
            <FaLock /> Your data is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}
