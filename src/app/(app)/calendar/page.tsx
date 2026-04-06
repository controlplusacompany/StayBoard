'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter,
  Plus,
  Info,
  MoreHorizontal
} from 'lucide-react';
import { format, addDays, startOfDay, isSameDay, parseISO, eachDayOfInterval } from 'date-fns';
import { getEnrichedRooms, getBookingsList } from '@/lib/store';
import { Room, Booking } from '@/types';
import Badge from '@/components/ui/Badge';
import RoomDrawer from '@/components/rooms/RoomDrawer';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNewBooking } from '@/components/booking/NewBookingProvider';

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const { open: openNewBooking } = useNewBooking();
  const [isMounted, setIsMounted] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<(Room & { booking?: Booking }) | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const daysCount = 30;
  const days = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, daysCount - 1)
  });

  useEffect(() => {
    setIsMounted(true);
    
    const loadCache = () => {
      setRooms(getEnrichedRooms([]));
      setBookings(getBookingsList());
    };
    
    loadCache();
    window.addEventListener('storage', loadCache);
    return () => window.removeEventListener('storage', loadCache);
  }, []);

  if (!isMounted) return <div className="p-20 text-center text-ink-muted">Loading calendar...</div>;

  const filteredRooms = rooms.filter(r => {
    const matchesSearch = 
      r.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.room_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProperty = !propertyId || propertyId === 'all' || r.property_id === propertyId;
    
    return matchesSearch && matchesProperty;
  });

  const getBookingForDate = (roomId: string, date: Date) => {
    return bookings.find(b => {
      if (b.room_id !== roomId || b.status === 'cancelled' || b.status === 'no_show') return false;
      const start = parseISO(b.check_in_date);
      const end = parseISO(b.check_out_date);
      // Booking covers the date if date is between start and end (inclusive of start, exclusive of end usually, but for visualization we show check-out day as part of it or handle overlap)
      return (isSameDay(date, start) || (date > start && date < end));
    });
  };

  const handleCellClick = (room: Room, date: Date, booking?: Booking) => {
    if (booking) {
      setSelectedRoom({ ...room, booking });
      setIsDrawerOpen(true);
    } else {
      router.push(`/booking/new?room=${room.room_number}&property=${room.property_id}&date=${format(date, 'yyyy-MM-dd')}`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-white overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-display font-medium text-ink-primary whitespace-nowrap tracking-tight">Room Availability</h1>
          
          <div className="flex items-center bg-bg-sunken rounded-lg p-1 border border-border-subtle">
            <button 
              onClick={() => setStartDate(addDays(startDate, -7))}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-ink-muted hover:text-ink-primary"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 text-sm font-medium text-ink-secondary min-w-[140px] text-center">
              {format(startDate, 'MMM yyyy')}
            </div>
            <button 
              onClick={() => setStartDate(addDays(startDate, 7))}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-ink-muted hover:text-ink-primary"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button 
            onClick={() => setStartDate(startOfDay(new Date()))}
            className="text-xs font-medium text-accent hover:underline uppercase tracking-wider"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input 
              type="text" 
              placeholder="Search room..." 
              className="input pl-10 h-10 w-48 text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost border-border-subtle h-10 px-3 flex items-center gap-2">
            <Filter size={16} />
            <span className="text-sm">Filter</span>
          </button>
          <button 
            onClick={() => openNewBooking()}
            className="btn btn-accent h-10 px-4 flex items-center gap-2"
          >
            <Plus size={16} />
            <span className="text-sm">New Booking</span>
          </button>
        </div>
      </header>

      {/* Calendar Grid Container */}
      <div className="flex-1 overflow-auto relative bg-bg-sunken/30 select-none">
        <table className="border-separate border-spacing-0 w-full min-w-max">
          <thead className="sticky top-0 z-30">
            <tr>
              <th className="sticky left-0 z-40 bg-white border-b border-r border-border-subtle p-0 w-48 h-14">
                <div className="flex flex-col justify-center items-start px-4 h-full">
                  <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest leading-none mb-1">Room</span>
                  <span className="text-xs text-ink-secondary">Total {filteredRooms.length} Units</span>
                </div>
              </th>
              {days.map((date, i) => {
                const isToday = isSameDay(date, new Date());
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                return (
                  <th 
                    key={i} 
                    className={`
                      border-b border-r border-border-subtle p-0 w-16 h-14 transition-colors
                      ${isToday ? 'bg-accent/5' : 'bg-white'}
                      ${isWeekend ? 'bg-bg-sunken/40' : ''}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className={`text-[10px] font-medium uppercase tracking-tighter ${isToday ? 'text-accent' : 'text-ink-muted'}`}>
                        {format(date, 'eee')}
                      </span>
                      <span className={`text-sm font-medium mt-0.5 ${isToday ? 'text-accent' : 'text-ink-primary'}`}>
                        {format(date, 'd')}
                      </span>
                    </div>
                    {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />}
                  </th>
                );
              })}
            </tr>
          </thead>
          
          <tbody className="relative z-10">
            {filteredRooms.map((room, ri) => (
              <tr key={room.id} className="group">
                <td className="sticky left-0 z-20 bg-white border-b border-r border-border-subtle p-0 w-48 h-16 group-hover:bg-bg-sunken transition-colors">
                  <div className="flex items-center gap-3 px-4 h-full cursor-pointer" onClick={() => {
                    const activeBooking = bookings.find(b => b.room_id === room.id && (isSameDay(parseISO(b.check_in_date), new Date()) || (new Date() > parseISO(b.check_in_date) && new Date() < parseISO(b.check_out_date))));
                    setSelectedRoom({ ...room, booking: activeBooking });
                    setIsDrawerOpen(true);
                  }}>
                    <div className={`w-1.5 h-8 rounded-full shadow-sm bg-status-${(room.status || 'vacant').toLowerCase()}-fg`} />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-ink-primary group-hover:text-accent transition-colors">Room {room.room_number}</span>
                        <span className="text-[10px] text-ink-muted uppercase tracking-wider font-light">{room.room_type}</span>
                    </div>
                  </div>
                </td>
                
                {(() => {
                  const segments: { type: 'empty' | 'booked'; duration: number; date: Date; booking?: Booking }[] = [];
                  let di = 0;
                  while (di < days.length) {
                    const date = days[di];
                    const booking = getBookingForDate(room.id, date);
                    
                    if (booking) {
                      // Calculate how many days of this booking are visible from this point
                      const checkOutDate = parseISO(booking.check_out_date);
                      let duration = 0;
                      let tempDi = di;
                      while (tempDi < days.length) {
                        const d = days[tempDi];
                        if (isSameDay(d, checkOutDate) || d >= checkOutDate) break;
                        duration++;
                        tempDi++;
                      }
                      
                      segments.push({ type: 'booked', duration, date, booking });
                      di = tempDi;
                    } else {
                      segments.push({ type: 'empty', duration: 1, date });
                      di++;
                    }
                  }

                  return segments.map((seg, si) => {
                    const isToday = isSameDay(seg.date, new Date());
                    const isWeekend = seg.date.getDay() === 0 || seg.date.getDay() === 6;

                    if (seg.type === 'booked' && seg.booking) {
                      const isBookingStart = isSameDay(seg.date, parseISO(seg.booking.check_in_date));
                      return (
                        <td 
                          key={si}
                          colSpan={seg.duration}
                          onClick={() => handleCellClick(room, seg.date, seg.booking)}
                          className={`
                            border-b border-r border-border-subtle p-1 h-16 relative cursor-pointer
                            hover:bg-bg-sunken transition-colors group/cell
                          `}
                        >
                          <div 
                            className={`
                              w-full h-full rounded-lg shadow-sm flex flex-col justify-center px-3 py-1 overflow-hidden transition-all duration-300 transform active:scale-[0.98]
                              ${seg.booking.status === 'confirmed' ? 'bg-accent text-white' : 
                                seg.booking.status === 'checked_in' ? 'bg-success text-white' : 
                                'bg-ink-muted text-white'}
                              ${!isBookingStart ? 'rounded-l-none' : ''}
                            `}
                            title={`${seg.booking.guest_name} • ${formatDate(seg.booking.check_in_date)} - ${formatDate(seg.booking.check_out_date)}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-medium leading-none truncate whitespace-nowrap">
                                {seg.booking.guest_name}
                              </span>
                              {seg.duration > 1 && (
                                <span className="text-[8px] font-medium opacity-70 uppercase whitespace-nowrap bg-white/10 px-1.5 py-0.5 rounded ml-2">
                                  {seg.duration} Nights
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={`w-1.5 h-1.5 rounded-full bg-white ${seg.booking.status === 'checked_in' ? 'animate-pulse' : ''}`} />
                              <span className="text-[8px] font-semibold uppercase tracking-widest opacity-80">
                                {seg.booking.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td 
                        key={si} 
                        onClick={() => handleCellClick(room, seg.date)}
                        className={`
                          border-b border-r border-border-subtle p-0.5 w-16 h-16 relative cursor-pointer
                          hover:bg-bg-sunken transition-colors group/cell
                          ${isToday ? 'bg-accent/[0.03]' : ''}
                          ${isWeekend ? 'bg-bg-sunken/20' : ''}
                        `}
                      >
                        <div className="w-full h-full opacity-0 group-hover/cell:opacity-100 flex items-center justify-center transition-opacity">
                           <Plus size={14} className="text-ink-muted hover:text-accent" />
                        </div>
                        {isToday && <div className="absolute left-0 right-0 top-0 h-0.5 bg-accent/20" />}
                      </td>
                    );
                  });
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <footer className="px-6 py-4 border-t border-border-subtle bg-white flex items-center justify-between shrink-0">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          {[
            { id: 'checked_in', label: 'Checked In', color: 'bg-success' },
            { id: 'confirmed', label: 'Confirmed', color: 'bg-accent' },
            { id: 'arriving_today', label: 'Arriving', color: 'bg-status-arriving-fg' },
            { id: 'checkout_today', label: 'Checking Out', color: 'bg-status-checkout-fg' },
            { id: 'cleaning', label: 'Cleaning', color: 'bg-status-cleaning-fg' },
            { id: 'maintenance', label: 'Maintenance', color: 'bg-status-maintenance-fg' },
            { id: 'vacant', label: 'Vacant', color: 'bg-status-vacant-fg' },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm border border-black/5`} />
              <span className="text-[10px] font-medium text-ink-muted uppercase tracking-[0.15em] leading-none">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2.5 ml-2">
            <div className="w-3.5 h-3.5 rounded ring-1 ring-accent ring-offset-2" />
            <span className="text-[10px] font-medium text-accent uppercase tracking-[0.15em] leading-none">Today</span>
          </div>
        </div>
        
        <div className="text-[11px] text-ink-muted">
           <span className="font-medium text-ink-secondary">PRO TIP:</span> Click any vacant slot to create a new booking on that date.
        </div>
      </footer>

      <RoomDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        room={selectedRoom}
      />
    </div>
  );
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'd MMM');
  } catch (e) {
    return dateStr;
  }
}
