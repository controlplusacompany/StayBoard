export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { NewBookingProvider } from '@/components/booking/NewBookingProvider';
import MobileLayoutWrapper from '@/components/layout/MobileLayoutWrapper';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-bg-canvas text-ink-muted">Loading StayBoard...</div>}>
      <NewBookingProvider>
        <MobileLayoutWrapper>
          {children}
        </MobileLayoutWrapper>
      </NewBookingProvider>
    </Suspense>
  );
}
