'use client';

import React from 'react';
import { RoomStatus } from '@/types';

interface MiniRoomGridProps {
  rooms: { status: RoomStatus; name: string }[];
  noWrap?: boolean;
}

export default function MiniRoomGrid({ rooms, noWrap }: MiniRoomGridProps) {
  const getDotClass = (status: RoomStatus) => {
    switch (status) {
      case 'vacant': return 'bg-status-vacant-bg text-status-vacant-fg border-status-vacant-fg/20';
      case 'occupied': return 'bg-status-occupied-bg text-status-occupied-fg border-status-occupied-fg/20';
      case 'cleaning': return 'bg-status-cleaning-bg text-status-cleaning-fg border-status-cleaning-fg/40 border-dotted';
      case 'maintenance': return 'bg-status-maintenance-bg text-status-maintenance-fg border-status-maintenance-fg/20';
      case 'checkout_today': return 'bg-status-checkout-bg text-status-checkout-fg border-status-checkout-fg/20';
      case 'arriving_today': return 'bg-status-arriving-bg text-status-arriving-fg border-status-arriving-fg/20';
      default: return 'bg-ink-muted text-white border-transparent';
    }
  };

  const formatRoomName = (name: string) => {
    if (!name) return '';
    // If it's "Bed X", just show "X"
    if (name.toLowerCase().startsWith('bed ')) {
      return name.split(' ')[1];
    }
    return name;
  };

  return (
    <div className={`flex ${noWrap ? 'flex-nowrap' : 'flex-wrap'} gap-[3px] w-full opacity-90 overflow-hidden`}>
      {rooms.map((room, idx) => (
        <div
          key={idx}
          className={`w-[30px] h-[30px] rounded-[0px] transition-all duration-300 ease-in-out ${getDotClass(room.status)} flex items-center justify-center border`}
          style={{ animationDelay: `${idx * 2}ms` }}
        >
          <span className="text-[10px] font-bold leading-none tracking-tighter">
            {formatRoomName(room.name)}
          </span>
        </div>
      ))}
    </div>
  );
}
