'use client';

import React, { createContext, useContext, useState } from 'react';
import NewBookingModal from './NewBookingModal';
import { useSearchParams } from 'next/navigation';

interface NewBookingContextType {
  open: () => void;
}

const NewBookingContext = createContext<NewBookingContextType | undefined>(undefined);

export function useNewBooking() {
  const context = useContext(NewBookingContext);
  if (!context) throw new Error('useNewBooking must be used within NewBookingProvider');
  return context;
}

export function NewBookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');

  return (
    <NewBookingContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <NewBookingModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        propertyId={propertyId}
      />
    </NewBookingContext.Provider>
  );
}
