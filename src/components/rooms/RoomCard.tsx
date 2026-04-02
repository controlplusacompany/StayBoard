'use client';

import React from 'react';
import { Room, RoomStatus } from '@/types';
import Badge from '../ui/Badge';
import { formatDate } from '@/lib/formatting';

interface RoomCardProps {
  room: Room;
  guestName?: string;
  checkoutDate?: string;
  hasBalance?: boolean;
  futureBooking?: string;
  onClick: (roomId: string) => void;
}

export default function RoomCard({ room, guestName, checkoutDate, hasBalance, futureBooking, onClick }: RoomCardProps) {
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

  const getStatusLabel = (status: RoomStatus) => {
    return status.replace('_', ' ');
  };

  return (
    <div 
      onClick={() => onClick(room.id)}
      className={`room-card ${getStatusClass(room.status)} group overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-status-${room.status}-fg opacity-80`} />
      <div className="flex justify-between items-start">
        <span className="room-card__number text-ink-primary font-display text-[22px]">
          {room.room_number}
        </span>
        <div className="flex flex-col items-end gap-1.5">
          <Badge type={room.status} label={getStatusLabel(room.status)} />
          {futureBooking && (
            <div className="flex items-center gap-1 bg-accent/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-accent uppercase tracking-tight">
              <span>{futureBooking}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-2">
        {room.status === 'vacant' ? (
          <span className="text-xs text-ink-muted">₹{room.base_price} / night</span>
        ) : guestName ? (
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="room-card__guest text-[12px] font-sans font-semibold text-ink-primary truncate">
              {guestName}
            </span>
            <span className="room-card__sub text-[11px] font-sans text-ink-muted">
              {room.status === 'checkout_today' ? (
                <span className="text-danger-fg">Checkout today</span>
              ) : room.status === 'arriving_today' ? (
                <span>Arriving today</span>
              ) : (
                <span>Checkout {checkoutDate ? formatDate(checkoutDate) : '...'}</span>
              )}
            </span>
          </div>
        ) : (
          <span className="text-xs text-ink-muted">
            {room.status === 'cleaning' ? 'Being cleaned' : 
             room.status === 'maintenance' ? 'Out of service' : ''}
          </span>
        )}
      </div>

      {hasBalance && (
        <span className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-danger shadow-[0_0_8px_rgba(220,38,38,0.5)]" title="Balance due" />
      )}
    </div>
  );
}
