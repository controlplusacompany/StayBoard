'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { NewBookingProvider } from '@/components/booking/NewBookingProvider';
import { Suspense } from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <NewBookingProvider>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-bg-canvas text-ink-muted">Loading StayBoard...</div>}>
        <div className="flex flex-col min-h-screen bg-bg-canvas">
          <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
          <div className="flex-1 flex overflow-hidden">
            <Sidebar 
              isMobileOpen={isMobileMenuOpen} 
              onCloseMobile={() => setIsMobileMenuOpen(false)} 
            />
            <main className="flex-1 mt-[56px] relative overflow-y-auto md:ml-64 w-full h-[calc(100vh-56px)]">
              {children}
            </main>
          </div>
        </div>
      </Suspense>
    </NewBookingProvider>
  );
}
