'use client';

import React from 'react';
import { RoomStatus } from '@/types';

interface MiniRoomGridProps {
  rooms: { status: RoomStatus }[];
}

export default function MiniRoomGrid({ rooms }: MiniRoomGridProps) {
  const getDotClass = (status: RoomStatus) => {
    switch (status) {
      case 'vacant': return 'bg-status-vacant-fg opacity-85';
      case 'occupied': return 'bg-status-occupied-fg opacity-100';
      case 'cleaning': return 'bg-status-cleaning-fg opacity-90';
      case 'maintenance': return 'bg-status-maintenance-fg opacity-100';
      case 'checkout_today': return 'bg-status-checkout-fg opacity-100';
      case 'arriving_today': return 'bg-status-arriving-fg opacity-100';
      default: return 'bg-ink-muted opacity-80';
    }
  };

  return (
    <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-[2px] w-full opacity-90">
      {rooms.map((room, idx) => (
        <div
          key={idx}
          className={`w-full aspect-square rounded-[1px] transition-colors duration-300 ease-in-out ${getDotClass(room.status)}`}
          style={{ animationDelay: `${idx * 2}ms` }}
        />
      ))}
    </div>
  );
}
