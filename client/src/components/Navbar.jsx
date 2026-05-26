import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, BookOpen, Search, Bookmark, Upload, User, LogOut, Menu, X, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const isActive = (path) => {
    return location.pathname === path ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white hover:scale-105';
  };

  const navItems = [
    { label: 'Home', path: '/', icon: BookOpen },
    { label: 'Semesters', path: '/semesters', icon: BookOpen },
    { label: 'Upload Notes', path: '/upload', icon: Upload },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Favorites', path: '/favorites', icon: Bookmark },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 py-3 sm:px-6 md:px-8 transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-montserrat text-lg font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-sky-400 hover:opacity-90">
          <BookOpen className="h-6 w-6 text-cyan-400 animate-pulse" />
          <span>ENotes<span className="text-white/60 text-sm font-light">.edu</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item, idx) => (
            <Link key={idx} to={item.path} className={`flex items-center gap-1.5 text-sm transition-all duration-200 ${isActive(item.path)}`}>
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            title="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-indigo-900" />}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-slate-800/80 p-1 pr-3 hover:bg-slate-700 transition-all"
              >
                <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center font-bold text-white uppercase text-sm">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <span className="text-sm font-medium text-slate-200 max-w-[100px] truncate">{user.name}</span>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-slate-900/95 border border-white/10 p-2 shadow-2xl backdrop-blur-xl z-50">
                  <div className="border-b border-white/5 px-3 py-2">
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    <p className="text-[10px] font-semibold text-cyan-400 mt-0.5">{user.department}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileDropdown(false)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                  {user.email === 'admin@notes.edu' && (
                    <Link
                      to="/admin"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                      <Settings className="h-4 w-4 text-purple-400" />
                      <span className="text-purple-300">Admin Panel</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 border-t border-white/5 mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
            >
              Sign In
            </Link>
          )}
        </div>

        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-indigo-900" />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden mt-3 rounded-xl bg-slate-900/90 border border-white/10 p-4 space-y-3 z-50 relative">
          <div className="flex flex-col gap-2">
            {navItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  location.pathname === item.path ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-1">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center font-bold text-white uppercase text-base">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{user.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 py-2 text-sm text-slate-300 hover:text-white"
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  {user.email === 'admin@notes.edu' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-900/30 border border-purple-500/20 py-2 text-sm text-purple-300 hover:text-white"
                    >
                      <Settings className="h-4 w-4" /> Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg bg-red-950/20 border border-red-500/30 py-2 text-sm text-red-400"
                  >
                    <LogOut className="h-4 w-4" /> Log Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 py-2.5 text-sm font-semibold text-white"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
