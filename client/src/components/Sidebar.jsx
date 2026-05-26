import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft, BookOpen, GraduationCap, Home, Search, Upload, Bookmark, User, Compass } from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);

  const isSemesterActive = (semNum) => {
    return location.pathname === `/semester/${semNum}` || location.pathname.startsWith(`/semester/${semNum}/`);
  };

  return (
    <>
      <aside
        className={`hidden md:flex flex-col h-[calc(100vh-65px)] sticky top-[65px] glass-panel border-r border-white/10 transition-all duration-300 z-30 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex justify-end p-2 border-b border-white/5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <span className={`text-xs font-bold tracking-wider text-slate-500 uppercase px-3 transition-opacity duration-300 ${collapsed ? 'opacity-0 h-0 block overflow-hidden' : 'opacity-100'}`}>
              Academic Semesters
            </span>
            <div className="mt-2 space-y-1">
              {semesters.map((sem) => (
                <button
                  key={sem}
                  onClick={() => navigate(`/semester/${sem}`)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 group relative ${
                    isSemesterActive(sem)
                      ? 'bg-gradient-to-r from-purple-900/40 to-cyan-900/40 text-cyan-400 border-l-2 border-cyan-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-semibold text-xs transition-all ${
                    isSemesterActive(sem) ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                  }`}>
                    {sem}
                  </div>
                  
                  <span className={`font-medium transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                    Semester {sem}
                  </span>

                  {collapsed && (
                    <div className="absolute left-14 hidden group-hover:block rounded bg-slate-950 px-2 py-1 text-xs text-white border border-white/10 shadow-xl whitespace-nowrap z-50">
                      Semester {sem} Details
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <span className={`text-xs font-bold tracking-wider text-slate-500 uppercase px-3 transition-opacity duration-300 ${collapsed ? 'opacity-0 h-0 block overflow-hidden' : 'opacity-100'}`}>
              Special Modules
            </span>
            <div className="mt-2 space-y-1">
              <NavLink
                to="/semester/9"
                className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all group relative ${
                  isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="h-5 w-5 text-purple-400" />
                <span className={`transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>Govt Exams</span>
                {collapsed && (
                  <div className="absolute left-14 hidden group-hover:block rounded bg-slate-950 px-2 py-1 text-xs text-white border border-white/10 shadow-xl whitespace-nowrap z-50">
                    Govt Exams (GATE/TNPSC)
                  </div>
                )}
              </NavLink>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <span className={`text-xs font-bold tracking-wider text-slate-500 uppercase px-3 transition-opacity duration-300 ${collapsed ? 'opacity-0 h-0 block overflow-hidden' : 'opacity-100'}`}>
              Navigation Shortcuts
            </span>
            <div className="mt-2 space-y-1">
              <NavLink
                to="/search"
                className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all group relative ${
                  isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="h-5 w-5" />
                <span className={`transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>Search Notes</span>
                {collapsed && (
                  <div className="absolute left-14 hidden group-hover:block rounded bg-slate-950 px-2 py-1 text-xs text-white border border-white/10 shadow-xl whitespace-nowrap z-50">
                    Search Notes
                  </div>
                )}
              </NavLink>
              <NavLink
                to="/upload"
                className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all group relative ${
                  isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="h-5 w-5" />
                <span className={`transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>Upload Notes</span>
                {collapsed && (
                  <div className="absolute left-14 hidden group-hover:block rounded bg-slate-950 px-2 py-1 text-xs text-white border border-white/10 shadow-xl whitespace-nowrap z-50">
                    Upload Notes
                  </div>
                )}
              </NavLink>
            </div>
          </div>
        </div>

        <div className={`p-4 border-t border-white/5 text-center text-xs text-slate-500 transition-opacity duration-300 ${collapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
          <div className="flex justify-center items-center gap-1 font-mono text-[10px] text-cyan-400/80">
            <Compass className="h-3 w-3 animate-spin-slow" /> EN-ENGINE v1.0
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 px-4 py-2 flex items-center justify-around shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <NavLink
          to="/"
          className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
            isActive ? 'text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </NavLink>
        
        <NavLink
          to="/semesters"
          className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
            isActive ? 'text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="h-5 w-5" />
          <span>Semesters</span>
        </NavLink>

        <NavLink
          to="/upload"
          className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
            isActive ? 'text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="bg-gradient-to-r from-purple-600 to-cyan-500 p-2.5 rounded-full -mt-5 shadow-lg border border-slate-900">
            <Upload className="h-4 w-4 text-white" />
          </div>
          <span className="mt-0.5">Upload</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
            isActive ? 'text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="h-5 w-5" />
          <span>Search</span>
        </NavLink>

        <NavLink
          to="/favorites"
          className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
            isActive ? 'text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="h-5 w-5" />
          <span>Favorites</span>
        </NavLink>
      </nav>
    </>
  );
};

export default Sidebar;
