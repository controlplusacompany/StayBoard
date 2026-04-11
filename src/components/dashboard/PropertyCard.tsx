'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Property, RoomStatus } from '@/types';
import MiniRoomGrid from './MiniRoomGrid';
import Badge from '@/components/ui/Badge';

interface PropertyCardProps {
  property: Property;
  summary: {
    occupied: number;
    checkout_today: number;
    roomStatusList: { status: RoomStatus; floor?: number }[];
  };
}

export default function PropertyCard({ property, summary }: PropertyCardProps) {
  if (!property || !summary) return null;

  const roomStatusList = summary.roomStatusList || [];
  const floors = Array.from(new Set(roomStatusList.map((r) => r.floor ?? 1)))
    .sort((a, b) => {
      const numA = Number(a) === 0 ? 999 : Number(a);
      const numB = Number(b) === 0 ? 999 : Number(b);
      return numA - numB;
    });
  const hasMultipleFloors = floors.length > 1;

  return (
    <Link 
      href={`/property/${property.id}`}
      className="property-card bg-surface border border-border-subtle rounded-[var(--radius-lg)] p-5 md:p-7 shadow-sm transition-all duration-120 ease-out hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-4 md:gap-5 no-underline group"
    >
      <header className="flex justify-between items-start">
        <h3 className="text-[22px] font-display text-ink-primary leading-tight font-medium">
          {property.name}
        </h3>
        <Badge type={property.type} label={property.type} />
      </header>

      <div className="flex flex-col gap-1.5 mt-1">
        {!hasMultipleFloors ? (
          <div className="flex flex-col gap-2">
            <MiniRoomGrid rooms={roomStatusList} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            {floors.map(floor => (
              <div 
                key={floor} 
                className={`flex items-center gap-4 ${Number(floor) === 0 ? 'col-span-full mt-2' : ''}`}
              >
                <div className="flex flex-col min-w-[24px]">
                   <span className="text-[11px] font-regular text-ink-muted/80 uppercase tracking-normal leading-none">
                     {Number(floor) === 0 ? 'D' : `F${floor}`}
                   </span>
                </div>
                <div className={`flex-1 ${Number(floor) === 0 ? 'overflow-x-auto no-scrollbar' : ''}`}>
                   <MiniRoomGrid 
                     rooms={roomStatusList.filter(r => (r.floor ?? 1) === Number(floor))} 
                     noWrap={Number(floor) === 0}
                   />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="flex justify-between items-center text-[13px] font-sans text-ink-muted/70 mt-3 pt-4 border-t border-border-subtle/40">
        <div>
          <span>{summary.occupied} / {property.total_rooms} occupied</span>
        </div>
        <ArrowRight size={18} className="text-ink-muted/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
      </footer>
    </Link>
  );
}

