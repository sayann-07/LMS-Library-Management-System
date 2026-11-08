import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  LogOut,
  Database,
  Clock,
  Menu,
  X,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Books Catalog', path: '/books', icon: BookOpen },
    { name: 'Members Directory', path: '/members', icon: Users },
    { name: 'Book Transactions', path: '/transactions', icon: ArrowLeftRight },
  ];

  const displayName = user?.username || 'admin';

  return (
    <div className="min-h-screen flex bg-[#F6F3EE] text-[#1C1917] selection:bg-[#B87B28] selection:text-[#FFFFFF]">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Refined Warm Ivory / Sand Aesthetic) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#FAF8F5] text-[#1C1917] border-r border-[#E8DFC8] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-[4px_0_24px_rgba(28,25,23,0.03)] ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full max-lg:invisible'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#E8DFC8] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C88E3E] to-[#A3691A] flex items-center justify-center text-white shadow-sm font-bold">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-serif font-bold text-base text-[#1C1917] tracking-tight leading-none block">
                Library
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#8C5914] font-bold mt-1 block">
                Management System
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="lg:hidden p-1.5 rounded-lg text-[#4D473E] hover:bg-[#F6F3EE] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          <div className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-widest text-[#524C42]">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="relative block"
              >
                <div
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-[#EFE7D8] text-[#1C1917] font-bold border-l-4 border-[#B87B28] shadow-[0_2px_8px_rgba(184,123,40,0.12)]'
                      : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F2ECE1]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-[#8C5914]' : 'text-[#524C42]'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-[#8C5914]" />
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Database Status Widget */}
        <div className="mx-4 mb-4 p-3.5 rounded-xl bg-white border border-[#E8DFC8] shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1C1917]">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#8C5914]" />
              <span>MySQL 8.0</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[9px] font-bold text-[#047857] uppercase tracking-wider">
                Live
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#4D473E] mt-1.5 font-mono">
            database: <strong className="text-[#1C1917]">library_db</strong>
          </p>
        </div>

        {/* Admin Footer */}
        <div className="p-4 border-t border-[#E8DFC8] bg-white">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#B87B28]/15 border border-[#B87B28]/40 flex items-center justify-center text-[#8C5914] font-serif font-bold text-xs uppercase">
                {displayName.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-[#1C1917] capitalize leading-none">
                  {displayName}
                </p>
                <p className="text-[10px] text-[#524C42] mt-0.5">Administrator</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            aria-label="Sign out of administrative account"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#FEF2F2] text-[#4D473E] hover:text-[#DC2626] border border-[#E8DFC8] hover:border-[#FECACA] text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header Navbar */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-[#E8DFC8] flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-xl text-[#4D473E] hover:bg-[#F6F3EE] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Right Header Status Widgets */}
          <div className="flex items-center gap-3 text-xs">
            {currentTime && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFC8] text-[#4D473E]">
                <Clock className="w-3.5 h-3.5 text-[#8C5914]" />
                <span className="font-mono text-[11px]">{currentTime}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857]">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-semibold text-[11px]">MySQL 8.0</span>
            </div>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto bg-[#F6F3EE]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Website Footer (Copyright) */}
        <footer className="py-4 px-6 lg:px-10 bg-white border-t border-[#E8DFC8] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-[#524C42]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#1C1917]">Library Management System</span>
            <span className="text-[#8C5914]" aria-hidden="true">•</span>
            <span>College DBMS Project</span>
          </div>
          <div className="text-[11px]">
            <span>&copy; {new Date().getFullYear()} Library Management System. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
