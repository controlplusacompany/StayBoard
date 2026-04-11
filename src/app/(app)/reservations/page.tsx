'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  ChevronRight, 
  Plus, 
  Filter,
  UserCircle2,
  CalendarDays,
  Clock,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { format, parseISO, isAfter, startOfDay, isToday } from 'date-fns';
import { getBookingsList, getSelectedProperty, getStoredRooms } from '@/lib/store';
import { Booking, Room } from '@/types';
import Badge from '@/components/ui/Badge';
import { useNewBooking } from '@/components/booking/NewBookingProvider';
import Modal from '@/components/ui/Modal';

export default function ReservationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unassigned' | 'assigned'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { open: openNewBooking } = useNewBooking();
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const currentProperty = getSelectedProperty();
      setPropertyId(currentProperty);

      const [rawBookings, rawRooms] = await Promise.all([
        getBookingsList(),
        getStoredRooms()
      ]);
      
      setBookings(rawBookings);
      setRooms(rawRooms);
      setDataLoaded(true);
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const today = startOfDay(new Date());

  const filteredBookings = bookings.filter(b => {
    // 1. Property Filter
    if (propertyId && propertyId !== 'all' && b.property_id !== propertyId) return false;

    // 2. Future or Current Filter (Only show bookings that haven't checked out yet)
    const checkOut = parseISO(b.check_out_date);
    if (!isAfter(checkOut, today) && !isToday(checkOut)) return false;

    // 3. Status Filter: ONLY show pending arrivals (unassigned or assigned)
    if (b.status !== 'unassigned' && b.status !== 'assigned') return false;

    // 4. Manual Status Filter
    if (statusFilter === 'unassigned' && b.status !== 'unassigned') return false;
    if (statusFilter === 'assigned' && b.status !== 'assigned') return false;

    // 5. Search
    const matchesSearch = 
      b.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.guest_phone.includes(searchQuery);

    return matchesSearch;
  }).sort((a, b) => parseISO(a.check_in_date).getTime() - parseISO(b.check_in_date).getTime());

  const getRoomNumber = (roomId: string) => {
    return rooms.find(r => r.id === roomId)?.room_number || 'N/A';
  };

  if (!dataLoaded) return (
    <div className="p-6 md:p-10 flex flex-col gap-6 animate-pulse bg-bg-canvas min-h-full">
      <div className="flex flex-col gap-3">
        <div className="h-3 w-40 bg-bg-sunken rounded" />
        <div className="h-10 w-64 bg-bg-sunken rounded" />
      </div>
      <div className="h-14 bg-bg-sunken rounded-xl" />
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-bg-sunken rounded-xl" />)}
    </div>
  );

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 animate-slide-up bg-bg-canvas min-h-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-medium text-accent uppercase tracking-[0.3em] font-sans">{format(new Date(), 'EEEE, dd MMM yyyy')}</span>
          <h1 className="text-4xl md:text-5xl font-display text-ink-primary tracking-tighter font-medium text-balance">Future Reservations</h1>
        </div>
        
        <button 
          onClick={() => openNewBooking()}
          className="btn btn-accent flex items-center gap-2"
        >
          <Plus size={18} />
          <span>New Reservation</span>
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-border-subtle shadow-sm">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input 
            type="text" 
            className="input pl-10 h-10 w-full" 
            placeholder="Search by name or phone..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
          {(['all', 'unassigned', 'assigned'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap ${statusFilter === status ? 'bg-accent text-white shadow-md' : 'bg-bg-sunken text-ink-muted hover:text-ink-primary border border-border-subtle'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <div 
              key={booking.id} 
              className="bg-white border border-border-subtle rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedBooking(booking)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-bg-sunken flex items-center justify-center text-ink-muted group-hover:bg-accent/5 group-hover:text-accent transition-colors">
                    <UserCircle2 size={24} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-ink-primary group-hover:text-accent transition-colors">{booking.guest_name}</h3>
                    <div className="flex items-center gap-3 text-sm text-ink-muted">
                      <span className="font-mono">{booking.guest_phone}</span>
                      <span className="w-1 h-1 rounded-full bg-border-strong" />
                      <span>{(booking.adults || 0) + (booking.children || 0)} Guests</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 md:gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-ink-muted tracking-widest flex items-center gap-1.5">
                      <CalendarDays size={12} /> Stay Dates
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink-primary">{format(parseISO(booking.check_in_date), 'dd MMM')}</span>
                      <ArrowRight size={14} className="text-ink-muted" />
                      <span className="text-sm font-medium text-ink-primary">{format(parseISO(booking.check_out_date), 'dd MMM')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-ink-muted tracking-widest flex items-center gap-1.5">
                      <Clock size={12} /> Status
                    </span>
                    <div className="flex items-center gap-2">
                       <Badge type={booking.status} label={booking.status.replace('_', ' ')} />
                       {booking.status === 'assigned' && (
                         <span className="text-xs font-semibold text-accent">Room {getRoomNumber(booking.room_id)}</span>
                       )}
                    </div>
                  </div>

                  <div className="bg-bg-sunken/50 px-4 py-2 rounded-lg border border-border-subtle flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-ink-muted tracking-widest">Total Amount</span>
                    <span className="text-lg font-mono font-semibold text-ink-primary">₹{booking.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-border-subtle border-dashed rounded-2xl py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-bg-sunken flex items-center justify-center text-ink-muted opacity-20">
              <ClipboardList size={32} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-ink-primary">No future reservations</h3>
              <p className="text-ink-muted text-sm mt-1">Found 0 bookings matching your criteria.</p>
            </div>
            <button 
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
              className="text-xs font-bold text-accent uppercase tracking-widest hover:underline mt-2"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Booking Details Modal (Reuse logic if needed or just show basic info) */}
      <Modal 
        isOpen={!!selectedBooking} 
        onClose={() => setSelectedBooking(null)}
        title="Reservation Details"
      >
        {selectedBooking && (
          <div className="flex flex-col gap-6">
            <div className="bg-bg-sunken p-4 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-ink-muted shadow-sm">
                <UserCircle2 size={24} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-ink-primary">{selectedBooking.guest_name}</h3>
                <span className="text-xs text-ink-muted font-mono">{selectedBooking.guest_phone}</span>
              </div>
              <div className="ml-auto">
                <Badge type={selectedBooking.status} label={selectedBooking.status.replace('_', ' ')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-border-subtle rounded-lg p-4 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold text-ink-muted tracking-widest flex items-center gap-1.5 line-clamp-1">
                  <Calendar size={12} /> Check-In
                </span>
                <span className="text-sm font-semibold text-ink-primary">
                  {format(parseISO(selectedBooking.check_in_date), 'EEEE, dd MMM yyyy')}
                </span>
              </div>
              <div className="border border-border-subtle rounded-lg p-4 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold text-ink-muted tracking-widest flex items-center gap-1.5 line-clamp-1">
                  <Calendar size={12} /> Check-Out
                </span>
                <span className="text-sm font-semibold text-ink-primary">
                  {format(parseISO(selectedBooking.check_out_date), 'EEEE, dd MMM yyyy')}
                </span>
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-accent uppercase tracking-widest">Pricing</span>
                <span className="font-mono text-sm text-ink-primary">Base Rate: ₹{Math.round(selectedBooking.total_amount / (Math.max(1, (parseISO(selectedBooking.check_out_date).getTime() - parseISO(selectedBooking.check_in_date).getTime()) / (1000 * 60 * 60 * 24))))}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-accent uppercase tracking-widest">Total Stay</span>
                <div className="text-xl font-mono font-bold text-ink-primary">₹{selectedBooking.total_amount.toLocaleString()}</div>
              </div>
            </div>

            {selectedBooking.status === 'unassigned' && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                 <div className="text-amber-600 mt-0.5"><Clock size={16} /></div>
                 <div className="flex flex-col gap-1">
                   <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">Unassigned Reservation</span>
                   <p className="text-xs text-amber-700 leading-relaxed">
                     This guest has a confirmed reservation but no specific room has been assigned yet. This allows for flexible inventory management.
                   </p>
                 </div>
              </div>
            )}
            
            <button 
              onClick={() => setSelectedBooking(null)}
              className="btn btn-primary w-full"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
