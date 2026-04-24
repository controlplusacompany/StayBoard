'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  format, 
  addDays, 
  subDays, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO, 
  isWithinInterval,
  startOfDay
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Search,
  User,
  MoreVertical
} from 'lucide-react';
import { Room, Booking } from '@/types';
import Badge from '../ui/Badge';

interface TimelineViewProps {
  rooms: Room[];
  bookings: Booking[];
  onBookingClick?: (bookingId: string) => void;
  onRoomClick?: (roomId: string) => void;
}

export default function TimelineView({ rooms, bookings, onBookingClick, onRoomClick }: TimelineViewProps) {
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [daysCount, setDaysCount] = useState(14);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const days = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, daysCount - 1)
  });

  const handlePrev = () => setStartDate(subDays(startDate, 7));
  const handleNext = () => setStartDate(addDays(startDate, 7));
  const handleToday = () => setStartDate(startOfDay(new Date()));

  // CELL DIMENSIONS
  const ROW_HEIGHT = 72;
  const COLUMN_WIDTH = 120;
  const SIDEBAR_WIDTH = 180;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
      {/* Timeline Toolbar */}
      <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-bg-sunken/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-xl border border-border-subtle p-1 shadow-sm">
            <button 
              onClick={handlePrev}
              className="p-1.5 hover:bg-bg-sunken rounded-lg transition-colors text-ink-muted"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-bold text-ink-primary hover:bg-bg-sunken rounded-lg transition-colors border-x border-border-subtle/50"
            >
              Today
            </button>
            <button 
              onClick={handleNext}
              className="p-1.5 hover:bg-bg-sunken rounded-lg transition-colors text-ink-muted"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <span className="text-sm font-display font-semibold text-ink-primary">
            {format(startDate, 'MMMM yyyy')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={daysCount}
            onChange={(e) => setDaysCount(Number(e.target.value))}
            className="text-xs font-bold bg-white border border-border-subtle rounded-xl px-3 py-2 outline-none focus:border-accent"
          >
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* ROOM SIDEBAR */}
        <div 
          className="flex-shrink-0 bg-white border-r border-border-subtle z-20 shadow-[4px_0_12px_rgba(0,0,0,0.02)]"
          style={{ width: SIDEBAR_WIDTH }}
        >
          {/* Sidebar Header Space */}
          <div className="h-12 border-b border-border-subtle bg-bg-sunken/10 flex items-center px-4">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Rooms</span>
          </div>
          
          <div className="flex flex-col">
            {rooms.map(room => (
              <div 
                key={room.id}
                className="h-[72px] border-b border-border-subtle flex items-center px-4 hover:bg-bg-sunken/30 cursor-pointer transition-colors"
                onClick={() => onRoomClick?.(room.id)}
              >
                <div className="flex flex-col">
                   <span className="text-sm font-bold text-ink-primary">Room {room.room_number}</span>
                   <span className="text-[10px] text-ink-muted leading-none font-medium mt-0.5">{room.type?.toUpperCase() || 'STANDARD'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TIMELINE GRID */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar bg-slate-50/50"
        >
          <div style={{ width: days.length * COLUMN_WIDTH, minWidth: '100%' }}>
            {/* DATE HEADER */}
            <div className="flex sticky top-0 z-10 bg-white shadow-sm">
              {days.map(day => {
                const isToday = isSameDay(day, new Date());
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                
                return (
                  <div 
                    key={day.toISOString()}
                    className={`flex-shrink-0 h-12 border-b border-r border-border-subtle flex flex-col items-center justify-center gap-0.5 ${isToday ? 'bg-accent/5' : isWeekend ? 'bg-bg-sunken/20' : ''}`}
                    style={{ width: COLUMN_WIDTH }}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-tight ${isToday ? 'text-accent' : 'text-ink-muted'}`}>
                      {format(day, 'EEE')}
                    </span>
                    <span className={`text-xs font-black ${isToday ? 'text-accent' : 'text-ink-primary'}`}>
                      {format(day, 'dd')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* GRID ROWS */}
            <div className="relative">
              {rooms.map(room => (
                <div 
                  key={room.id}
                  className="flex h-[72px] border-b border-border-subtle relative"
                >
                  {/* Grid Lines */}
                  {days.map(day => (
                    <div 
                      key={day.toISOString()} 
                      className={`flex-shrink-0 border-r border-border-subtle/30 ${isSameDay(day, new Date()) ? 'bg-accent/5' : ''}`}
                      style={{ width: COLUMN_WIDTH }}
                    />
                  ))}

                  {/* BOOKING BLOCKS */}
                  {bookings
                    .filter(b => b.room_id === room.id && b.status !== 'cancelled')
                    .map(booking => {
                      const checkIn = startOfDay(parseISO(booking.check_in_date));
                      const checkOut = startOfDay(parseISO(booking.check_out_date));
                      
                      // Calculate offset and width
                      const dayIntervalStart = startOfDay(days[0]);
                      const dayIntervalEnd = startOfDay(days[days.length - 1]);

                      // Only show if overlaps with current timeline window
                      if (checkOut < dayIntervalStart || checkIn > dayIntervalEnd) return null;

                      const displayStart = checkIn < dayIntervalStart ? dayIntervalStart : checkIn;
                      const displayEnd = checkOut > dayIntervalEnd ? dayIntervalEnd : checkOut;

                      const diffDaysStart = Math.round((displayStart.getTime() - dayIntervalStart.getTime()) / (1000 * 60 * 60 * 24));
                      const durationDays = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                      
                      // Special case for blocks starting/ending outside view
                      const visibleDuration = Math.round((displayEnd.getTime() - displayStart.getTime()) / (1000 * 60 * 60 * 24));

                      const left = diffDaysStart * COLUMN_WIDTH;
                      const width = visibleDuration * COLUMN_WIDTH;

                      // Styles based on status
                      let statusStyles = 'bg-accent text-white border-accent';
                      if (booking.status === 'checked_in') statusStyles = 'bg-status-occupied-bg text-status-occupied-fg border-status-occupied-border';
                      if (booking.status === 'checked_out') statusStyles = 'bg-bg-sunken text-ink-muted border-border-subtle';
                      if (booking.status === 'confirmed') statusStyles = 'bg-status-arriving-bg text-status-arriving-fg border-status-arriving-border';

                      return (
                        <div 
                          key={booking.id}
                          onClick={() => onBookingClick?.(booking.id)}
                          className={`absolute top-1/2 -translate-y-1/2 h-[52px] rounded-xl border flex items-center px-4 cursor-pointer transition-all hover:scale-[1.02] hover:z-10 shadow-sm ${statusStyles}`}
                          style={{ 
                            left: left + 4, 
                            width: Math.max(width - 8, 40),
                            zIndex: 1
                          }}
                        >
                          <div className="flex items-center gap-3 w-full overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                               <User size={14} className="opacity-80" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold truncate leading-tight">{booking.guest_name}</span>
                              <span className="text-[10px] opacity-80 leading-none mt-0.5">{durationDays} Nights</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
