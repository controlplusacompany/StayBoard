'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col pt-0">
      {/* Top Progress Bar */}
      <div className="relative w-full h-[3px] bg-accent/5 overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-accent animate-progress-infinity w-full origin-left" />
      </div>
      
      {/* Background Pulse */}
      <div className="absolute inset-0 bg-bg-surface/30 backdrop-blur-[1px] flex items-center justify-center animate-pulse duration-1000">
         <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin transition-all shadow-lg" />
            <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] animate-pulse">StayBoard Sync</span>
         </div>
      </div>

      <style jsx global>{`
        @keyframes progress-infinity {
          0% { transform: scaleX(0); transform-origin: left; }
          45% { transform: scaleX(1); transform-origin: left; }
          50% { transform: scaleX(1); transform-origin: right; }
          100% { transform: scaleX(0); transform-origin: right; }
        }
        .animate-progress-infinity {
          animation: progress-infinity 1.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      `}</style>
    </div>
  );
}
