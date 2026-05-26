import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, AlertTriangle, FileText, ArrowLeft, RefreshCw, Upload } from 'lucide-react';

const ErrorPage = ({ type: defaultType = '404' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const type = searchParams.get('type') || defaultType;

  const errorStates = {
    '404': {
      title: '404 - Shelf Not Found',
      subtitle: 'The volume or page you are requesting appears to have been misplaced from our library index.',
      ctaText: 'Return to Library Dashboard',
      ctaAction: () => navigate('/semesters'),
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      icon: Compass,
      illustration: (
        <svg className="w-56 h-40 text-cyan-400/80 animate-float" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M60 70C80 60 95 62 100 65C105 62 120 60 140 70V30C120 20 105 22 100 25C95 22 80 20 60 30V70Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M100 25V65" stroke="currentColor" strokeWidth="2"/>
          <path d="M50 45C30 35 25 50 30 65M150 45C170 35 175 50 170 65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="35" cy="20" r="1.5" fill="currentColor" />
          <circle cx="165" cy="85" r="2.5" fill="currentColor" className="animate-ping" />
        </svg>
      )
    },
    'upload-failed': {
      title: 'Index Syncing Failed',
      subtitle: 'Our library nodes encountered a data validation error during file compilation. Please verify the document format and tags.',
      ctaText: 'Retry Document Upload',
      ctaAction: () => navigate('/upload'),
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/10',
      icon: AlertTriangle,
      illustration: (
        <svg className="w-56 h-40 text-red-400/80" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="70" y="20" width="60" height="80" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="85" y1="40" x2="115" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="85" y1="60" x2="115" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="100" cy="80" r="15" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1.5"/>
          <path d="M100 73V81M100 85H100.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    'empty-notes': {
      title: 'Shelf Empty - No Notes Uploaded',
      subtitle: 'This semester core directory is currently vacant. Share your study files and help peer engineers build the index!',
      ctaText: 'Upload First Study Sheet',
      ctaAction: () => navigate('/upload'),
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      icon: FileText,
      illustration: (
        <svg className="w-56 h-40 text-purple-400/80 animate-pulse" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 80C70 80 90 77 100 80C110 77 130 80 160 80V40C130 40 110 37 100 40C90 37 70 40 40 40V80Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M100 40V80" stroke="currentColor" strokeWidth="2"/>
          <path d="M96 22C96 19 98 17 100 17C102 17 104 19 104 22C104 24.5 101.5 25 100.5 26.5C100 27 100 28 100 28M100 32H100.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    }
  };

  const state = errorStates[type] || errorStates['404'];
  const Icon = state.icon;

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 relative z-20 min-h-[calc(100vh-200px)] flex flex-col justify-center animate-in fade-in duration-300">
      <div className="flex justify-center">
        {state.illustration}
      </div>

      <div className="glass-panel rounded-2xl p-8 border border-white/5 space-y-4">
        <div className={`mx-auto h-12 w-12 rounded-full ${state.iconBg} flex items-center justify-center ${state.iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>

        <h2 className="font-montserrat text-xl font-extrabold text-white">{state.title}</h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
          {state.subtitle}
        </p>

        <button
          onClick={state.ctaAction}
          className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:opacity-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
        >
          {type === 'upload-failed' ? <RefreshCw className="h-4 w-4" /> : type === 'empty-notes' ? <Upload className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          <span>{state.ctaText}</span>
        </button>
      </div>

    </div>
  );
};

export default ErrorPage;
