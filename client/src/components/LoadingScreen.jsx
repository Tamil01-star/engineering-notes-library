import React, { useEffect, useState } from 'react';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onComplete) setTimeout(onComplete, 400);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#070b13] text-white">
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-cyan-600/10 blur-[120px] animate-pulse"></div>

      <div className="flex flex-col items-center max-w-sm w-full px-6">
        <div className="book-animation relative w-[80px] h-[60px] mb-8">
          <div className="book-spine absolute left-[39px] top-0 w-[2px] h-full bg-slate-500 rounded-sm"></div>
          
          <div className="absolute left-[8px] top-[2px] w-[32px] h-[56px] border border-slate-600 bg-book-leather rounded-l-md transform-origin-right"></div>
          <div className="absolute left-[40px] top-[2px] w-[32px] h-[56px] border border-slate-600 bg-book-leather rounded-r-md transform-origin-left"></div>

          <div className="absolute left-[12px] top-[4px] w-[28px] h-[52px] bg-[#FAF6EE] rounded-l-sm border-r border-slate-300"></div>
          <div className="absolute left-[40px] top-[4px] w-[28px] h-[52px] bg-[#FAF6EE] rounded-r-sm border-l border-slate-300"></div>

          <div className="flipping-page-1 absolute left-[40px] top-[4px] w-[28px] h-[52px] bg-[#FAF6EE] rounded-r-sm origin-left border-l border-slate-300 animate-flip-page"></div>
          <div className="flipping-page-2 absolute left-[40px] top-[4px] w-[28px] h-[52px] bg-[#FAF6EE] rounded-r-sm origin-left border-l border-slate-300 animate-flip-page animation-delay-200"></div>
          <div className="flipping-page-3 absolute left-[40px] top-[4px] w-[28px] h-[52px] bg-[#FAF6EE] rounded-r-sm origin-left border-l border-slate-300 animate-flip-page animation-delay-400"></div>
        </div>

        <h2 className="font-montserrat text-lg font-bold tracking-wider mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          ENGINEERING NOTES LIBRARY
        </h2>
        <p className="text-xs text-slate-400 font-mono tracking-widest uppercase mb-6">
          System Initializing... {Math.min(progress, 100)}%
        </p>

        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-2xl">
          <div
            className="h-full bg-gradient-to-r from-purple-600 via-cyan-500 to-sky-400 rounded-full transition-all duration-150"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </div>

      <style>{`
        @keyframes flipPage {
          0% {
            transform: rotateY(0deg);
            z-index: 10;
          }
          50% {
            transform: rotateY(-90deg);
          }
          100% {
            transform: rotateY(-180deg);
            z-index: 0;
            background-color: #f7f3e8;
          }
        }
        .animate-flip-page {
          animation: flipPage 1.6s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        .animation-delay-200 {
          animation-delay: 0.3s;
        }
        .animation-delay-400 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
