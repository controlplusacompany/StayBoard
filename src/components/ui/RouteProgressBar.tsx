'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When path changes, we show a brief progress animation
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] h-[3px]">
      <div className="h-full bg-accent animate-route-progress origin-left shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
      <style jsx>{`
        @keyframes route-progress {
          0% { transform: scaleX(0); }
          20% { transform: scaleX(0.3); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
        .animate-route-progress {
          animation: route-progress 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
