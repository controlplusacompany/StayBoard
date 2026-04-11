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
      case 'vacant': return 'bg-status-vacant-fg opacity-85';
      case 'occupied': return 'bg-status-occupied-fg opacity-100';
      case 'cleaning': return 'bg-status-cleaning-fg opacity-90';
      case 'maintenance': return 'bg-status-maintenance-fg opacity-100';
      case 'checkout_today': return 'bg-status-checkout-fg opacity-100';
      case 'arriving_today': return 'bg-status-arriving-fg opacity-100';
      default: return 'bg-ink-muted opacity-80';
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
          className={`w-[30px] h-[30px] rounded-[0px] transition-all duration-300 ease-in-out ${getDotClass(room.status)} flex items-center justify-center`}
          style={{ animationDelay: `${idx * 2}ms` }}
        >
          <span className="text-[10px] font-bold text-white/90 leading-none tracking-tighter">
            {formatRoomName(room.name)}
          </span>
        </div>
      ))}
    </div>
  );
}
