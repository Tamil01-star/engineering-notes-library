import React from 'react';
import { Book, Bookmark, Star, Eye } from 'lucide-react';

const BookCard = ({
  title,
  subtitle,
  semester,
  subjectCode,
  count,
  onClick,
  colorIndex = 0,
  isFavorite = false,
  onFavoriteToggle,
  rating = 5.0
}) => {
  const leatherColors = [
    { bg: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)', spine: '#2e1065', border: '#a78bfa' },
    { bg: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', spine: '#172554', border: '#60a5fa' },
    { bg: 'linear-gradient(135deg, #14532d 0%, #022c22 100%)', spine: '#14532d', border: '#34d399' },
    { bg: 'linear-gradient(135deg, #701a75 0%, #4a044e 100%)', spine: '#4a044e', border: '#f472b6' },
    { bg: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)', spine: '#451a03', border: '#fbbf24' },
    { bg: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)', spine: '#134e4a', border: '#2dd4bf' },
    { bg: 'linear-gradient(135deg, #be123c 0%, #881337 100%)', spine: '#881337', border: '#fda4af' },
    { bg: 'linear-gradient(135deg, #374151 0%, #111827 100%)', spine: '#1f2937', border: '#9ca3af' }
  ];

  const currentTheme = leatherColors[colorIndex % leatherColors.length];

  return (
    <div
      onClick={onClick}
      className="book-wrapper cursor-pointer group relative w-full h-[280px] flex items-center justify-center p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-cyan-500/30 hover:bg-slate-800/40 transition-all duration-300 shadow-xl"
    >
      <div className="book relative w-[160px] h-[220px] select-none transition-transform duration-500 transform-style-preserve-3d group-hover:-rotate-y-12 group-hover:translate-x-2">
        <div className="absolute inset-0 bg-black/40 rounded-r-lg blur-sm transform translate-x-2 translate-y-2 z-0 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-300"></div>

        <div className="book-pages absolute top-[4px] left-[6px] w-[92%] h-[96%] bg-[#FAF6EE] rounded-r border border-slate-300 flex flex-col justify-between p-3 font-poppins z-2">
          <div className="flex-1 w-full flex flex-col gap-2 pt-2 border-t-2 border-red-200">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              {subjectCode || `Semester ${semester}`}
            </span>
            <p className="text-[11px] font-bold text-slate-700 leading-tight line-clamp-3">
              {title}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-500" />
              <span>{rating} Rating</span>
            </div>
          </div>
          
          <div className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-700 border-t border-slate-200 pt-2 flex justify-between items-center">
            <span>{count !== undefined ? `${count} Notes` : 'VIEW INDEX'}</span>
            <Eye className="h-3 w-3 text-slate-400" />
          </div>
        </div>

        <div
          className="book-cover absolute top-0 left-0 w-full h-full rounded-r-xl rounded-l-md transform-origin-left transition-transform duration-500 ease-out z-10"
          style={{
            background: currentTheme.bg,
            transformStyle: 'preserve-3d',
            border: `1px solid ${currentTheme.border}30`
          }}
        >
          <div className="absolute inset-0 bg-black/10 rounded-r-xl rounded-l-md pointer-events-none mix-blend-overlay"></div>

          <div
            className="book-spine absolute top-0 left-0 w-[14px] h-full rounded-l-md border-r border-black/20"
            style={{ backgroundColor: currentTheme.spine }}
          >
            <div className="h-full w-full flex flex-col justify-around py-4 opacity-30">
              <div className="h-[2px] bg-black"></div>
              <div className="h-[2px] bg-black"></div>
              <div className="h-[2px] bg-black"></div>
              <div className="h-[2px] bg-black"></div>
            </div>
          </div>

          <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 rounded-tr-sm" style={{ borderColor: currentTheme.border }}></div>
          <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 rounded-br-sm" style={{ borderColor: currentTheme.border }}></div>

          <div className="absolute inset-0 pl-6 pr-3 py-6 flex flex-col justify-between h-full font-montserrat text-white">
            <div className="space-y-1">
              <div className="text-[9px] font-bold tracking-widest text-white/50 uppercase">
                {subjectCode || `SEM ${semester}`}
              </div>
              <h3 className="text-xs font-extrabold tracking-tight leading-tight line-clamp-3 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-300">
                {title}
              </h3>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <div className="flex flex-col">
                <span className="text-[8px] text-white/40 uppercase">Contents</span>
                <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                  {subtitle || `${count || 0} Files`}
                </span>
              </div>
              <div className="h-6 w-6 rounded-full bg-black/30 flex items-center justify-center border border-white/10">
                <Book className="h-3 w-3 text-cyan-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {onFavoriteToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all z-20"
        >
          <Bookmark className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      )}
    </div>
  );
};

export default BookCard;
