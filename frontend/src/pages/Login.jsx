import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  CheckCircle,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// =========================================================================
// 📸 LIVE IMAGE LINK FOR LOGIN PAGE
// Paste your direct image URL below (must be direct link to image file):
// For ImgBB: Use "https://i.ibb.co/..." (from "Direct links" or right-click "Copy Image Address")
// =========================================================================
export const LIVE_LOGIN_IMAGE_URL = 'https://i.ibb.co/hRCh5KCs/download.jpg';

// Helper to convert common photo page URLs (like ibb.co viewer links) into direct image links
const resolveDirectImageUrl = (url) => {
  if (url && url.includes('BVwdDgwL')) return 'https://i.ibb.co/hRCh5KCs/download.jpg';
  if (url && url.includes('PzFGSsbJ')) return 'https://i.ibb.co/5xGh7XzC/library.jpg';
  if (url && url.includes('v4W6DYNC')) return 'https://i.ibb.co/9H0kGtxm/library.jpg';
  return url || '/assets/library-login.jpg';
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);
  // Default to local asset for instant zero-latency rendering
  const [imgSrc, setImgSrc] = useState('/assets/library-login.jpg');

  const redirectPath = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.username, formData.password);
      setAuthSuccess(true);
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials. Please check your username and password.');
      setLoading(false);
    }
  };

  const handleImageError = () => {
    if (imgSrc === '/assets/library-login.jpg') {
      // Fallback 1: Live CDN URL if local asset is ever missing
      setImgSrc(resolveDirectImageUrl(LIVE_LOGIN_IMAGE_URL));
    } else if (imgSrc !== '/assets/library-login.svg') {
      // Fallback 2: Local SVG artwork
      setImgSrc('/assets/library-login.svg');
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-[#F6F3EE] flex items-center justify-center p-4 sm:p-6 lg:p-10 select-none overflow-hidden">
      {/* Subtle Warm Beige Ambient Background Circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#E8DFC8]/50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-[#E5D7BF]/40 blur-3xl pointer-events-none" />

      {/* Main Container Card (Split-Screen) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden bg-white shadow-[0_20px_60px_rgba(28,25,23,0.08)] border border-[#E8DFC8]"
      >
        {/* LEFT COLUMN: Picture Showcase Area */}
        <div className="lg:col-span-7 relative min-h-[320px] lg:min-h-[620px] bg-[#1C1917] overflow-hidden flex flex-col justify-between p-8 sm:p-12">
          {/* Background Image / Picture (Instant zero-latency load) */}
          <div className="absolute inset-0 z-0 bg-[#24201D]">
            <img
              src={imgSrc}
              alt="Library Showcase"
              loading="eager"
              fetchpriority="high"
              decoding="sync"
              className="w-full h-full object-cover object-center opacity-85"
              onError={handleImageError}
            />
            {/* Deep Warm Gradient Vignette Overlay for Crisp Typography */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-[#1C1917]/50 to-[#1C1917]/25" />
          </div>

          {/* Top Badge: College DBMS Project */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-[#B87B28]/50 text-[#F5C77E] text-xs font-semibold tracking-wider shadow-sm">
              <GraduationCap className="w-4 h-4 text-[#E5A952]" />
              <span>College DBMS Project</span>
            </div>
          </div>

          {/* Bottom Captions & Narrative */}
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#FAF6F0] leading-tight font-bold tracking-tight">
              Library <br />
              <span className="text-[#E5A952]">Management System</span>
            </h1>

            <p className="mt-3.5 text-[#D6C7B2] text-xs sm:text-sm leading-relaxed max-w-md font-light">
              A comprehensive relational database management system designed to govern catalog inventories, memberships, and book circulation.
            </p>

            <div className="mt-6 pt-5 border-t border-white/15 flex items-center justify-between text-xs text-[#D6C7B2]/80">
              <span className="italic font-serif">"Knowledge is a treasure, but practice is the key to it."</span>
              <span className="font-mono text-[#E5A952] text-[11px] font-semibold bg-black/40 px-2 py-0.5 rounded border border-white/10">
                MySQL 8.0
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Administrator Login Card */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="w-full max-w-sm mx-auto">
            {/* Header Emblem & Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F6F3EE] border border-[#E8DFC8] text-[#B87B28] mb-3.5 shadow-sm">
                <BookOpen className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1C1917]">
                Administrator Sign In
              </h2>
              <p className="text-xs text-[#6A645A] mt-1 font-light">
                Please enter your credentials to access the portal.
              </p>
            </div>

            {/* Error Message Toast */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  className="mb-6 p-3.5 rounded-xl bg-[#E11D48]/10 border border-[#E11D48]/20 flex items-center gap-2.5 text-xs text-[#BE123C]"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-[11px] font-bold text-[#6A645A] uppercase tracking-wider mb-1.5">
                  Admin Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6A645A] group-focus-within:text-[#B87B28] transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="e.g. admin"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm placeholder-[#A8A29E] focus:outline-none focus:border-[#B87B28] focus:bg-white focus:ring-1 focus:ring-[#B87B28] transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[11px] font-bold text-[#6A645A] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6A645A] group-focus-within:text-[#B87B28] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm placeholder-[#A8A29E] focus:outline-none focus:border-[#B87B28] focus:bg-white focus:ring-1 focus:ring-[#B87B28] transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6A645A] hover:text-[#1C1917] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-[#FAF6F0] font-semibold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-[#E5A952]" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Credential Reference Box */}
            <div className="mt-8 p-3.5 rounded-xl bg-[#F8F6F2] border border-[#E8DFC8] text-center">
              <span className="text-[11px] text-[#6A645A] block mb-1">
                Authorized Credentials:
              </span>
              <code className="text-xs font-mono font-bold text-[#1C1917] bg-white px-2.5 py-1 rounded-lg border border-[#E8DFC8] inline-block">
                admin / admin1123
              </code>
            </div>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#524C42]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
              <span>Protected by MySQL & JWT Encryption</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* EDUCATIONAL AUTHENTICATION SUCCESS ANIMATION MODAL */}
      <AnimatePresence>
        {authSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1C1917]/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-[#E8DFC8]"
            >
              {/* Elegant Animated Seal */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 mx-auto rounded-full bg-[#059669]/10 border-2 border-[#059669] flex items-center justify-center text-[#059669] mb-4 shadow-sm"
              >
                <CheckCircle className="w-8 h-8" />
              </motion.div>

              <h3 className="text-xl font-serif font-bold text-[#1C1917]">
                Access Granted
              </h3>
              <p className="text-xs text-[#6A645A] mt-1.5 leading-relaxed">
                Administrator credentials verified. Loading catalog and circulation records...
              </p>

              {/* Progress bar */}
              <div className="mt-5 w-full bg-[#F6F3EE] h-1.5 rounded-full overflow-hidden border border-[#E8DFC8]">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                  className="bg-[#B87B28] h-full rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Copyright & Terms Footer */}
      <footer className="absolute bottom-3 inset-x-0 text-center text-[11px] text-[#524C42] z-10 hidden sm:block">
        <span>&copy; {new Date().getFullYear()} Library Management System • College DBMS Project • All rights reserved.</span>
      </footer>
    </main>
  );
};

export default Login;
