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
import { getEnrichedRooms, getBookingsList, getSelectedProperty } from '@/lib/store';
import { Room, Booking } from '@/types';
import Badge from '@/components/ui/Badge';
import RoomDrawer from '@/components/rooms/RoomDrawer';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNewBooking } from '@/components/booking/NewBookingProvider';

export default function CalendarPage() {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const { open: openNewBooking } = useNewBooking();
  const [isMounted, setIsMounted] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [floorFilter, setFloorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState<(Room & { booking?: Booking }) | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const daysCount = 30;
  const days = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, daysCount - 1)
  });

  useEffect(() => {
    setIsMounted(true);

    const fetchData = async () => {
      try {
        const currentProperty = getSelectedProperty();
        // Moved setPropertyId below to prevent flicker

        const [fetchedRooms, fetchedBookings] = await Promise.all([
          getEnrichedRooms(),
          getBookingsList()
        ]);

        // Ensure we ALWAYS have rooms to show
        const roomsToSet = Array.isArray(fetchedRooms) && fetchedRooms.length > 0
          ? fetchedRooms
          : [];

        setPropertyId(currentProperty);
        setRooms(roomsToSet);
        setBookings(Array.isArray(fetchedBookings) ? fetchedBookings : []);
      } catch (error) {
        console.error("Failed to fetch calendar data:", error);
      }
    };

    fetchData();
    window.addEventListener('storage', fetchData);
    return () => window.removeEventListener('storage', fetchData);
  }, []);

  if (!isMounted) return <div className="p-20 text-center text-ink-muted">Loading calendar...</div>;

  const filteredRooms = rooms.filter(r => {
    const matchesSearch =
      r.room_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProperty = !propertyId || propertyId === 'all' || r.property_id === propertyId;

    const matchesFloor = floorFilter === 'all' || String(r.floor) === floorFilter;

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesProperty && matchesFloor && matchesStatus;
  });

  const getBookingForDate = (roomId: string, date: Date) => {
    const day = startOfDay(date);
    const isToday = isSameDay(day, startOfDay(new Date()));

    // 1. Look for a guest who is CURRENTLY in the room (checked-in) and checking out today
    if (isToday) {
      const checkoutGuest = bookings.find(b =>
        b.room_id === roomId &&
        b.status === 'checked_in' &&
        isSameDay(startOfDay(parseISO(b.check_out_date)), day)
      );
      if (checkoutGuest) return checkoutGuest;
    }

    // 2. Otherwise, look for a guest who occupies the night of this date
    // Or if the user explicitly wants to see checkouts on their final day
    return bookings.find(b => {
      if (b.room_id !== roomId || b.status === 'cancelled' || b.status === 'no_show') return false;
      const start = startOfDay(parseISO(b.check_in_date));
      const end = startOfDay(parseISO(b.check_out_date));

      // Standard occupancy covers the night of the date
      const staysNight = (isSameDay(day, start) || (day > start && day < end));

      // If it's the checkout day and the guest is still in-house, show them
      const isCheckOutDay = isSameDay(day, end);
      const isStillInHouse = b.status === 'checked_in';

      return staysNight || (isCheckOutDay && isStillInHouse);
    });
  };

  const handleCellClick = (room: Room, date: Date, booking?: Booking) => {
    if (booking) {
      setSelectedRoom({ ...room, booking });
      setIsDrawerOpen(true);
    } else {
      const isToday = isSameDay(date, new Date());
      // If the room is being cleaned or under maintenance TODAY, open the room drawer to manage its status first
      if (isToday && (room.status === 'cleaning' || room.status === 'maintenance')) {
        setSelectedRoom(room);
        setIsDrawerOpen(true);
      } else {
        router.push(`/booking/new?room=${room.room_number}&property=${room.property_id}&date=${format(date, 'yyyy-MM-dd')}`);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-white overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white z-20 shadow-sm">
        <div className="flex items-center gap-3 md:gap-6 justify-between md:justify-start">
          <h1 className="text-lg md:text-xl font-display font-medium text-ink-primary whitespace-nowrap tracking-tight">Availability</h1>

          <div className="flex items-center bg-bg-sunken rounded-lg p-1 border border-border-subtle">
            <button
              onClick={() => setStartDate(addDays(startDate, -7))}
              className="p-1 md:p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-ink-muted hover:text-ink-primary"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-2 md:px-4 text-[11px] md:text-sm font-medium text-ink-secondary min-w-[90px] md:min-w-[140px] text-center">
              {format(startDate, 'MMM yyyy')}
            </div>
            <button
              onClick={() => setStartDate(addDays(startDate, 7))}
              className="p-1 md:p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-ink-muted hover:text-ink-primary"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setStartDate(startOfDay(new Date()))}
            className="text-[10px] md:text-xs font-bold text-accent hover:underline uppercase tracking-wider hidden sm:block"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <div className="relative flex-1 md:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Room#"
              className="input pl-9 h-9 md:h-10 w-full md:w-48 text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-accent' : 'btn-ghost border-border-subtle'} h-9 md:h-10 px-2.5 md:px-3 flex items-center gap-2 transition-all shrink-0`}
          >
            <Filter size={16} />
            <span className="text-sm hidden md:inline">Filter</span>
            {(floorFilter !== 'all' || statusFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>

          <button
            onClick={() => openNewBooking()}
            className="btn btn-accent h-9 md:h-10 px-2.5 md:px-4 flex items-center gap-2 shrink-0"
          >
            <Plus size={16} />
            <span className="text-sm hidden md:inline">New Booking</span>
          </button>
        </div>

        {showFilters && (
          <div className="absolute right-4 top-32 md:top-20 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-border-subtle z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-ink-primary">Filter Rooms</h3>
              <button
                onClick={() => {
                  setFloorFilter('all');
                  setStatusFilter('all');
                }}
                className="text-[10px] text-accent font-bold uppercase tracking-wider hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest mb-1.5 block">Floor</label>
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border-subtle bg-bg-sunken px-2 text-sm outline-none focus:border-accent transition-colors"
                >
                  <option value="all">All Floors</option>
                  {[...new Set(rooms.map(r => r.floor))].sort().map(floor => (
                    <option key={floor} value={String(floor)}>Floor {floor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest mb-1.5 block">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['all', 'vacant', 'occupied', 'cleaning', 'maintenance'].map(status => {
                    const getStatusClass = (s: string) => {
                      if (statusFilter !== s) return 'bg-bg-sunken text-ink-muted border-transparent hover:border-border-subtle';
                      switch(s) {
                        case 'vacant': return 'bg-status-vacant-fg text-white border-status-vacant-border';
                        case 'occupied': return 'bg-status-occupied-fg text-white border-status-occupied-border';
                        case 'cleaning': return 'bg-status-cleaning-fg text-white border-status-cleaning-border';
                        case 'maintenance': return 'bg-status-maintenance-fg text-white border-status-maintenance-border';
                        default: return 'bg-accent text-white border-accent';
                      }
                    };
                    
                    return (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`
                          px-2 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all
                          ${getStatusClass(status)}
                        `}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Calendar Grid Container */}
      <div className="flex-1 overflow-auto relative bg-bg-sunken/30 select-none">
        <table className="border-separate border-spacing-0 w-full min-w-max">
          <thead className="sticky top-0 z-40 bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]">
            <tr>
              <th className="sticky left-0 top-0 z-50 bg-white border-b border-r border-border-subtle p-0 w-20 md:w-48 h-14 shadow-[2px_0_10px_-3px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col justify-center items-center md:items-start px-2 md:px-4 h-full">
                  <span className="text-[9px] md:text-[10px] font-semibold text-ink-muted uppercase tracking-widest leading-none mb-1">Room</span>
                  <span className="text-[9px] md:text-xs text-ink-secondary hidden md:block">Total {filteredRooms.length} Units</span>
                </div>
              </th>
              {days.map((date, i) => {
                const isToday = isSameDay(date, new Date());
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <th
                    key={i}
                    className={`
                      border-b border-r border-border-subtle p-0 w-12 md:w-16 h-14 transition-colors relative
                      ${isToday ? 'bg-accent/5' : 'bg-white'}
                      ${isWeekend ? 'bg-bg-sunken/40' : ''}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className={`text-[9px] md:text-[10px] font-semibold uppercase tracking-tighter ${isToday ? 'text-accent' : 'text-ink-muted'}`}>
                        {format(date, 'eee')}
                      </span>
                      <span className={`text-xs md:text-sm font-semibold mt-0.5 ${isToday ? 'text-accent' : 'text-ink-primary'}`}>
                        {format(date, 'd')}
                      </span>
                    </div>
                    {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-accent z-10" />}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="">
            {filteredRooms.map((room, ri) => (
              <tr key={room.id} className="group">
                <td className="sticky left-0 z-30 bg-white border-b border-r border-border-subtle p-0 w-20 md:w-48 h-16 group-hover:bg-bg-sunken transition-colors shadow-[2px_0_10px_-3px_rgba(0,0,0,0.05)]">
                  {(() => {
                    const today = startOfDay(new Date());
                    const activeBooking = bookings.find(b => {
                      if (b.room_id !== room.id || b.status === 'cancelled' || b.status === 'no_show' || b.status === 'completed') return false;
                      const start = startOfDay(parseISO(b.check_in_date));
                      const end = startOfDay(parseISO(b.check_out_date));
                      return (isSameDay(today, start) || (today > start && today < end)) || isSameDay(today, end);
                    });

                    let effectiveStatus = (room.status || 'vacant').toLowerCase();
                    let colorClass = `bg-status-${effectiveStatus.replace('_', '-')}-fg`;
                    if (activeBooking) {
                      const checkOutDay = startOfDay(parseISO(activeBooking.check_out_date));
                      const checkInDay = startOfDay(parseISO(activeBooking.check_in_date));

                      const isCheckoutToday = isSameDay(checkOutDay, today);
                      const isArrivingToday = isSameDay(checkInDay, today);

                      if (isCheckoutToday) {
                        colorClass = 'bg-status-checkout-fg';
                      } else if (isArrivingToday) {
                        colorClass = 'bg-status-arriving-fg';
                      } else if (activeBooking.status === 'checked_in') {
                        colorClass = 'bg-success';
                      } else if (activeBooking.status === 'confirmed') {
                        colorClass = 'bg-accent';
                      }
                    }

                    return (
                      <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 h-full cursor-pointer" onClick={() => {
                        setSelectedRoom({ ...room, booking: activeBooking });
                        setIsDrawerOpen(true);
                      }}>
                        <div className={`w-1 h-6 md:w-1.5 md:h-8 rounded-full shadow-sm ${colorClass} shrink-0`} />
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs md:text-sm font-semibold text-ink-primary group-hover:text-accent transition-colors truncate">
                            <span className="md:inline hidden">Room </span>{room.room_number}
                          </span>
                          <span className="text-[8px] md:text-[10px] text-ink-muted uppercase tracking-wider font-light">Unit</span>
                        </div>
                      </div>
                    );
                  })()}
                </td>

                {(() => {
                  const segments: { type: 'empty' | 'booked'; duration: number; date: Date; booking?: Booking }[] = [];
                  let di = 0;
                  while (di < days.length) {
                    const date = days[di];
                    const booking = getBookingForDate(room.id, date);

                    if (booking) {
                      let checkOutDate;
                      try {
                        checkOutDate = startOfDay(parseISO(booking.check_out_date));
                      } catch (e) {
                        checkOutDate = addDays(date, 1);
                      }

                      let duration = 0;
                      let tempDi = di;
                      const currentBookingId = booking.id;

                      while (tempDi < days.length) {
                        const nextBooking = getBookingForDate(room.id, days[tempDi]);
                        if (nextBooking?.id === currentBookingId) {
                          duration++;
                          tempDi++;
                        } else {
                          break;
                        }
                      }

                      const finalDi = Math.max(tempDi, di + 1);
                      const finalDuration = Math.max(duration, 1);

                      segments.push({ type: 'booked', duration: finalDuration, date, booking });
                      di = finalDi;
                    } else {
                      segments.push({ type: 'empty', duration: 1, date });
                      di++;
                    }
                  }

                  return segments.map((seg, si) => {
                    const isToday = isSameDay(seg.date, new Date());
                    const isWeekend = seg.date.getDay() === 0 || seg.date.getDay() === 6;

                    if (seg.type === 'booked' && seg.booking) {
                      const checkInDate = parseISO(seg.booking.check_in_date);
                      const checkOutDate = parseISO(seg.booking.check_out_date);
                      const isBookingStart = isSameDay(seg.date, checkInDate);
                      const isFutureBooking = checkInDate > new Date();
                      const isCheckoutToday = isSameDay(checkOutDate, new Date());
                      const isArrivingToday = isSameDay(checkInDate, new Date());

                      const displayStatus = isFutureBooking ? 'confirmed' : seg.booking.status;

                      // Determine color class
                      let colorClass = 'bg-ink-muted text-white';
                      let labelStatus = displayStatus;

                      if (isCheckoutToday && displayStatus === 'checked_in') {
                        colorClass = 'bg-status-checkout-fg text-white';
                        labelStatus = 'checking out';
                      } else if (isArrivingToday && displayStatus === 'confirmed') {
                        colorClass = 'bg-status-arriving-fg text-white';
                        labelStatus = 'arriving';
                      } else if (displayStatus === 'confirmed') {
                        colorClass = 'bg-accent text-white';
                      } else if (displayStatus === 'checked_in') {
                        colorClass = 'bg-success text-white';
                      }

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
                                  ${colorClass}
                                  ${!isBookingStart ? 'rounded-l-none' : ''}
                                `}
                            title={`${seg.booking.guest_name} • ${formatDate(seg.booking.check_in_date)} - ${formatDate(seg.booking.check_out_date)}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold leading-none truncate whitespace-nowrap">
                                {seg.booking.guest_name}
                              </span>
                              {seg.duration > 1 && (
                                <span className="text-[8px] font-semibold opacity-70 uppercase whitespace-nowrap bg-white/10 px-1.5 py-0.5 rounded ml-2">
                                  {seg.duration} Nights
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={`w-1.5 h-1.5 rounded-full bg-white ${displayStatus === 'checked_in' ? 'animate-pulse' : ''}`} />
                              <span className="text-[8px] font-semibold uppercase tracking-widest opacity-80">
                                {labelStatus.replace('_', ' ')}
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
                        {isToday && (room.status === 'cleaning' || room.status === 'maintenance') ? (
                          <div className={`
                            w-full h-full p-1 opacity-80
                          `}>
                            <div className={`
                              w-full h-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center
                              ${room.status === 'cleaning' ? 'border-status-cleaning-fg text-status-cleaning-fg bg-status-cleaning-fg/5' : 'border-status-maintenance-fg text-status-maintenance-fg bg-status-maintenance-fg/5'}
                            `}>
                              <span className="text-[7px] font-bold uppercase tracking-tighter leading-none">{room.status}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full opacity-0 group-hover/cell:opacity-100 flex items-center justify-center transition-opacity">
                            <Plus size={14} className="text-ink-muted hover:text-accent" />
                          </div>
                        )}
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
      <footer className="px-4 md:px-6 py-4 border-t border-border-subtle bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-wrap items-center gap-x-4 md:gap-x-8 gap-y-3">
          {[
            { id: 'checked_in', label: 'Checked In', color: 'bg-success' },
            { id: 'confirmed', label: 'Confirmed', color: 'bg-accent' },
            { id: 'arriving_today', label: 'Arriving', color: 'bg-status-arriving-fg' },
            { id: 'checkout_today', label: 'Checking Out', color: 'bg-status-checkout-fg' },
            { id: 'cleaning', label: 'Cleaning', color: 'bg-status-cleaning-fg' },
            { id: 'maintenance', label: 'Maintenance', color: 'bg-status-maintenance-fg' },
            { id: 'vacant', label: 'Vacant', color: 'bg-status-vacant-fg' },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color} shadow-sm border border-black/5 shrink-0`} />
              <span className="text-[9px] md:text-[10px] font-medium text-ink-muted uppercase tracking-wider leading-none truncate">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded ring-1 ring-accent ring-offset-1 shrink-0" />
            <span className="text-[9px] md:text-[10px] font-medium text-accent uppercase tracking-wider leading-none">Today</span>
          </div>
        </div>

        <div className="text-[10px] md:text-[11px] text-ink-muted border-t md:border-t-0 pt-3 md:pt-0 border-border-subtle md:text-right">
          <span className="font-bold text-ink-secondary hidden sm:inline">PRO TIP:</span> Click vacant slots to create bookings.
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
