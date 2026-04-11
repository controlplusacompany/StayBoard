'use client';

import React from 'react';
import { Room, RoomStatus } from '@/types';
import Badge from '../ui/Badge';
import { formatDate } from '@/lib/formatting';

interface RoomCardProps {
  room: Room;
  guestName?: string;
  propertyName?: string;
  checkoutDate?: string;
  hasBalance?: boolean;
  futureBooking?: string;
  status?: RoomStatus;
  currentBooking?: any;
  arrivalToday?: any;
  checkoutToday?: any;
  onClick: (roomId: string) => void;
}

export default function RoomCard({ 
  room, 
  guestName, 
  propertyName, 
  checkoutDate, 
  hasBalance, 
  futureBooking, 
  status, 
  currentBooking,
  arrivalToday,
  checkoutToday,
  onClick 
}: RoomCardProps) {
  // Use status prop if provided, otherwise fallback to room.status
  const effectiveStatus = status || room.status;
  
  // Use enriched room data from cloud
  const displayGuest = guestName || (room as any).guest_name;
  const displayCheckout = checkoutDate || (room as any).checkout_date;
  const getStatusClass = (status: RoomStatus) => {
    switch (status) {
      case 'vacant': return 'room-card--vacant';
      case 'occupied': return 'room-card--occupied';
      case 'cleaning': return 'room-card--cleaning';
      case 'maintenance': return 'room-card--maintenance';
      case 'checkout_today': return 'room-card--checkout';
      case 'arriving_today': return 'room-card--arriving';
      default: return '';
    }
  };

  const getStatusTextClass = (status: RoomStatus) => {
    switch (status) {
      case 'vacant': return 'text-status-vacant-fg';
      case 'occupied': return 'text-status-occupied-fg';
      case 'cleaning': return 'text-status-cleaning-fg';
      case 'maintenance': return 'text-status-maintenance-fg';
      case 'checkout_today': return 'text-status-checkout-fg';
      case 'arriving_today': return 'text-status-arriving-fg';
      default: return 'text-ink-primary';
    }
  };

  const getStatusLabel = (status: RoomStatus) => {
    return status.replace('_', ' ');
  };

  return (
    <div 
      onClick={() => onClick(room.id)}
      className={`room-card ${getStatusClass(effectiveStatus)} group overflow-hidden`}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className={`room-card__number font-display text-[24px] font-bold ${getStatusTextClass(effectiveStatus)}`}>
            {room.room_number}
          </span>
          {propertyName && (
            <span className="text-[9px] font-medium text-accent font-sans uppercase tracking-[0.15em] -mt-1 opacity-70">
              {propertyName}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge type={effectiveStatus} label={getStatusLabel(effectiveStatus)} />
        </div>
      </div>

      <div className="mt-auto pt-2">
        {effectiveStatus === 'vacant' ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-ink-muted">₹{room.base_price} / night</span>
          </div>
        ) : displayGuest ? (
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="room-card__guest text-[12px] font-sans font-medium text-ink-primary truncate">
              {displayGuest}
            </span>
            <span className="room-card__sub text-[11px] font-sans text-ink-muted">
              {effectiveStatus === 'checkout_today' ? (
                <span className="text-danger-fg">Checkout today</span>
              ) : effectiveStatus === 'arriving_today' ? (
                <span>Arriving today</span>
              ) : (
                <span>Checkout {displayCheckout ? formatDate(displayCheckout) : '...'}</span>
              )}
            </span>
          </div>
        ) : (
          <span className="text-xs text-ink-muted">
            {effectiveStatus === 'cleaning' ? 'Being cleaned' : 
             effectiveStatus === 'maintenance' ? 'Out of service' : ''}
          </span>
        )}
        

      </div>

      {hasBalance && (
        <span className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-danger shadow-[0_0_8px_rgba(220,38,38,0.5)]" title="Balance due" />
      )}
    </div>
  );
}
