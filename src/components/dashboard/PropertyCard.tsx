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
  const floors = Array.from(new Set(roomStatusList.map((r) => r.floor || 1))).sort((a, b) => a - b);
  const hasMultipleFloors = floors.length > 1;

  return (
    <Link 
      href={`/property/${property.id}`}
      className="property-card bg-surface border border-border-subtle rounded-[var(--radius-lg)] p-5 md:p-7 shadow-sm transition-all duration-120 ease-out hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-4 md:gap-5 no-underline group"
    >
      <header className="flex justify-between items-start">
        <h3 className="text-xl font-display text-ink-primary leading-tight">
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
          <div className="flex flex-col gap-3">
            {floors.map(floor => (
              <div key={floor} className="flex items-center gap-4">
                <div className="flex flex-col min-w-[32px]">
                   <span className="text-[10px] font-semibold text-ink-muted/50 uppercase tracking-widest leading-none">F{floor}</span>
                </div>
                <div className="flex-1">
                   <MiniRoomGrid rooms={roomStatusList.filter(r => (r.floor || 1) === floor)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 text-xs font-sans text-ink-muted mt-2 pt-1 border-t border-border-subtle/30">
        <div className="flex flex-wrap gap-2.5 items-center">
          <span>{summary.occupied} / {property.total_rooms} occupied</span>
          {summary.checkout_today > 0 && (
            <span className="text-warning flex items-center gap-1">
              • {summary.checkout_today} checking out today
            </span>
          )}
        </div>
        <ArrowRight size={16} className="text-ink-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all self-end sm:self-auto" />
      </footer>
    </Link>
  );
}

