import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useNavigate, Link } from "react-router-dom";
import { FaLock, FaShieldAlt, FaKey, FaUserPlus, FaFileAlt, FaEnvelope, FaEye, FaEyeSlash, FaUser, FaArrowRight } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const navigate = useNavigate();
  const { register, loading, error } = useAuthStore();

  // Password strength checker
  const checkPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
    if (pass.match(/[0-9]/)) strength++;
    if (pass.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e) => {
    const pass = e.target.value;
    setPassword(pass);
    checkPasswordStrength(pass);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      await register({ firstName, lastName, email, password, role: "owner" });
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-yellow-500";
    if (passwordStrength === 3) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength === 2) return "Fair";
    if (passwordStrength === 3) return "Good";
    return "Strong";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#000957] via-[#000957] to-[#344cb7] animate-gradient-shift"></div>
      
      {/* Floating animated shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-72 h-72 bg-[#ffeb00]/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-[#000957]/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-[#ffeb00]/5 rounded-full blur-2xl animate-pulse"></div>
      </div>

      {/* Animated Floating Icons with React Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Shield Icons */}
        <div className="absolute top-16 left-1/4 animate-float opacity-20">
          <FaShieldAlt className="w-14 h-14 text-[#ffeb00]" />
        </div>
        <div className="absolute bottom-28 right-1/3 animate-float-delayed opacity-15">
          <FaShieldAlt className="w-12 h-12 text-white" />
        </div>
        
        {/* User Add Icons */}
        <div className="absolute top-1/4 right-16 animate-float opacity-25">
          <FaUserPlus className="w-12 h-12 text-[#ffeb00]" />
        </div>
        
        {/* Document Icons */}
        <div className="absolute bottom-1/3 left-20 animate-float-delayed opacity-20">
          <FaFileAlt className="w-10 h-10 text-white" />
        </div>
        <div className="absolute top-36 right-28 animate-float opacity-15">
          <FaFileAlt className="w-14 h-14 text-[#ffeb00]" />
        </div>

        {/* Lock Icons */}
        <div className="absolute top-1/2 left-12 animate-float opacity-18">
          <FaLock className="w-12 h-12 text-white" />
        </div>

        {/* Sparkle effects */}
        <div className="absolute top-12 left-1/2 animate-ping opacity-30">
          <HiSparkles className="w-4 h-4 text-[#ffeb00]" />
        </div>
        <div className="absolute bottom-16 right-1/4 animate-ping opacity-40" style={{animationDelay: '1s'}}>
          <HiSparkles className="w-5 h-5 text-white" />
        </div>
        <div className="absolute top-1/3 right-12 animate-ping opacity-25" style={{animationDelay: '2s'}}>
          <HiSparkles className="w-4 h-4 text-[#ffeb00]" />
        </div>
        <div className="absolute bottom-1/2 left-1/4 animate-ping opacity-35" style={{animationDelay: '1.5s'}}>
          <HiSparkles className="w-4 h-4 text-white" />
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

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-2xl animate-fade-in-up">
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
              <FaShieldAlt className="w-4 h-4 text-[#ffeb00] animate-pulse" />
              <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-[#ffeb00] animate-expand"></div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-white via-[#ffeb00] to-white bg-clip-text text-transparent mb-2 animate-gradient-text">
            Create Account
          </h1>
          <p className="text-center text-white/90 mb-8 text-sm">
            Join us to secure your digital legacy
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-xl backdrop-blur-sm animate-shake">
              <p className="text-white text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Name Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="relative group">
                <label className="text-white/95 text-sm font-semibold mb-2 block">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-[#ffeb00]" />
                  </div>
                  <input
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ffeb00] focus:bg-white/10 transition-all duration-300 hover:border-white/30"
                    required
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className="relative group">
                <label className="text-white/95 text-sm font-semibold mb-2 block">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-[#ffeb00]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ffeb00] focus:bg-white/10 transition-all duration-300 hover:border-white/30"
                  />
                </div>
              </div>
            </div>

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
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ffeb00] focus:bg-white/10 transition-all duration-300 hover:border-white/30"
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
                  placeholder="Create a strong password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ffeb00] focus:bg-white/10 transition-all duration-300 hover:border-white/30"
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
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStrengthColor()} transition-all duration-500`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-semibold ${
                      passwordStrength <= 1 ? 'text-red-400' :
                      passwordStrength === 2 ? 'text-yellow-400' :
                      passwordStrength === 3 ? 'text-blue-400' :
                      'text-green-400'
                    }`}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    Use 8+ characters with mix of letters, numbers & symbols
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="relative group">
              <label className="text-white/95 text-sm font-semibold mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-[#ffeb00]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#ffeb00] focus:bg-white/10 transition-all duration-300 hover:border-white/30"
                  required
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-xs text-red-300 font-medium animate-shake">⚠ Passwords don't match</p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start p-4 bg-white/5 rounded-xl border border-white/10">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 mr-3 w-4 h-4 rounded bg-white/10 border-white/20 text-[#ffeb00] focus:ring-[#ffeb00]"
              />
              <label htmlFor="terms" className="text-sm text-white/80">
                I agree to the{" "}
                <a href="#" className="text-[#ffeb00] font-semibold hover:text-white transition-colors">
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#ffeb00] font-semibold hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading || (password && confirmPassword && password !== confirmPassword)}
              className={`w-full py-4 rounded-xl font-bold text-[#000957] shadow-lg transform transition-all duration-300 ${
                loading || (password && confirmPassword && password !== confirmPassword)
                  ? "bg-white/20 cursor-not-allowed text-white/50"
                  : "bg-gradient-to-r from-[#ffeb00] to-[#ffd700] hover:from-[#ffd700] hover:to-[#ffeb00] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,235,0,0.5)] active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account
                  <FaArrowRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-white/80">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#ffeb00] font-bold hover:text-white transition-colors duration-300 hover:underline"
              >
                Sign In
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
