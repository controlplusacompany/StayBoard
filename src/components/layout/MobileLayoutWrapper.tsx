'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

export default function MobileLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const isSettingsPage = pathname === '/settings';

  return (
    <div className="flex flex-col min-h-screen bg-bg-canvas">
      <Navbar
        onMenuClick={() => setIsMobileMenuOpen(true)}
        isSettingsPage={isSettingsPage}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 mt-[56px] relative overflow-y-auto w-full h-[calc(100vh-56px)] md:ml-[76px]">
          {children}
        </main>
      </div>
    </div>
  );
}
