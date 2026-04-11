'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  ClipboardList,
  Trash2
} from 'lucide-react';
import { format, parseISO, isAfter, startOfDay, isToday } from 'date-fns';
import { getBookingsList, getSelectedProperty, getStoredRooms, updateBookingStatus, deleteBooking } from '@/lib/store';
import { Booking, Room } from '@/types';
import Badge from '@/components/ui/Badge';
import { useNewBooking } from '@/components/booking/NewBookingProvider';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useRealtime } from '@/hooks/useRealtime';

export default function ReservationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_house'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { open: openNewBooking } = useNewBooking();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

  const handleCheckInNow = (booking: Booking) => {
    setSelectedBooking(null);
    router.push(`/booking/new?booking_id=${booking.id}&mode=checkin&room=${booking.room_id || ''}&property=${booking.property_id}`);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await updateBookingStatus(bookingId, 'cancelled');
        toast('Reservation cancelled', 'success');
        setSelectedBooking(null);
        // Data will refresh via storage listener
      } catch (err) {
        toast('Failed to cancel reservation', 'error');
      }
    }
  };

  const handleDeleteBooking = (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation(); // Don't open the detail modal
    setBookingToDelete(bookingId);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;
    try {
      await deleteBooking(bookingToDelete);
      toast('Reservation deleted permanently', 'success');
    } catch (err) {
      toast('Failed to delete reservation', 'error');
    } finally {
      setBookingToDelete(null);
    }
  };

  const loadData = useCallback(async () => {
    const currentProperty = getSelectedProperty();
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('stayboard_user_role'));
    }

    const [rawBookings, rawRooms] = await Promise.all([
      getBookingsList(),
      getStoredRooms()
    ]);
    
    setPropertyId(currentProperty);
    setBookings(rawBookings);
    setRooms(rawRooms);
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [loadData]);

  // Supabase Realtime Sync
  useRealtime(loadData);

  const today = startOfDay(new Date());

  const filteredBookings = bookings.filter(b => {
    // 1. Property Filter
    if (propertyId && propertyId !== 'all' && b.property_id !== propertyId) return false;

    // 2. Base Exclusion: Don't show completed, cancelled, or no-show bookings in this view
    if (['checked_out', 'cancelled', 'no_show'].includes(b.status)) return false;

    // 3. Status Filtering: Only show bookings that are NOT completed/cancelled
    // The user wants all future and currently in-house bookings together
    if (b.status === 'checked_in') return true;
    
    const checkIn = parseISO(b.check_in_date);
    if (!isAfter(checkIn, today) && !isToday(checkIn)) return false;
    
    return true;

    // 5. Search
    const matchesSearch = 
      b.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.guest_phone.includes(searchQuery);

    return matchesSearch;
  }).sort((a, b) => {
    return parseISO(a.check_in_date).getTime() - parseISO(b.check_in_date).getTime();
  });

  const isReception = userRole === 'reception';

  const getRoomNumber = (roomId: string) => {
    return rooms.find(r => r.id === roomId)?.room_number || 'N/A';
  };

  if (!dataLoaded) return (
    <div className="p-6 md:p-10 flex flex-col gap-6 animate-pulse bg-bg-canvas min-h-full">
      <div className="flex flex-col gap-3">
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
          <h1 className="text-4xl md:text-5xl font-display text-ink-primary tracking-tighter font-medium text-balance">Reservations & Stays</h1>
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
          <div className="px-5 py-2.5 rounded-full text-xs font-bold bg-accent/10 text-accent border border-accent/20 uppercase tracking-widest whitespace-nowrap">
            Upcoming & Active Reservations
          </div>
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

                  {!isReception && (
                    <div className="flex items-center gap-3">
                      <div className="bg-bg-sunken/50 px-4 py-2 rounded-lg border border-border-subtle flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-ink-muted tracking-widest">Total Amount</span>
                        <span className="text-lg font-mono font-semibold text-ink-primary">₹{booking.total_amount.toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteBooking(e, booking.id)}
                        className="w-10 h-10 rounded-lg border border-red-50 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Delete Reservation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
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

      <Modal 
        isOpen={!!selectedBooking} 
        onClose={() => setSelectedBooking(null)}
        title="Reservation Details"
      >
        {selectedBooking && (
          <div className="flex flex-col gap-4">
            <div className="bg-bg-sunken p-3 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-ink-muted shadow-sm">
                <UserCircle2 size={20} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-semibold text-ink-primary leading-tight">{selectedBooking.guest_name}</h3>
                <span className="text-[10px] text-ink-muted font-mono">{selectedBooking.guest_phone}</span>
              </div>
              <div className="ml-auto">
                <Badge type={selectedBooking.status} label={selectedBooking.status.replace('_', ' ')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border-subtle rounded-lg p-3 flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-ink-muted tracking-widest flex items-center gap-1.5">
                  <Calendar size={10} /> Check-In
                </span>
                <span className="text-xs font-semibold text-ink-primary">
                  {format(parseISO(selectedBooking.check_in_date), 'dd MMM yyyy')}
                </span>
              </div>
              <div className="border border-border-subtle rounded-lg p-3 flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-ink-muted tracking-widest flex items-center gap-1.5">
                  <Calendar size={10} /> Check-Out
                </span>
                <span className="text-xs font-semibold text-ink-primary">
                  {format(parseISO(selectedBooking.check_out_date), 'dd MMM yyyy')}
                </span>
              </div>
            </div>

            {!isReception && (
              <div className="bg-accent/5 border border-accent/10 rounded-xl p-3 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-semibold text-accent uppercase tracking-widest">Pricing</span>
                  <span className="font-mono text-xs text-ink-primary">Rate: ₹{Math.round(selectedBooking.total_amount / (Math.max(1, (parseISO(selectedBooking.check_out_date).getTime() - parseISO(selectedBooking.check_in_date).getTime()) / (1000 * 60 * 60 * 24))))}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-semibold text-accent uppercase tracking-widest">Total Amount</span>
                  <div className="text-lg font-mono font-semibold text-ink-primary leading-none">₹{selectedBooking.total_amount.toLocaleString()}</div>
                </div>
              </div>
            )}

            {selectedBooking.status === 'unassigned' && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2">
                 <div className="text-amber-600 mt-0.5"><Clock size={14} /></div>
                 <p className="text-[10px] text-amber-800 leading-tight">
                   <strong className="font-semibold">Unassigned:</strong> Confirmed reservation without an assigned room.
                 </p>
              </div>
            )}
            
            <div className="flex flex-col gap-2 mt-2">
              <button 
                onClick={() => handleCheckInNow(selectedBooking)}
                className="btn btn-accent w-full py-3 text-[11px]"
              >
                Check in Now
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  className="btn btn-danger flex-1 flex items-center justify-center gap-2 py-2.5 text-[9px]"
                >
                  <Trash2 size={12} />
                  Cancel Reservation
                </button>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="btn btn-primary flex-1 py-2.5 text-[9px]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Custom Delete Confirmation Popup */}
      <Modal
        isOpen={!!bookingToDelete}
        onClose={() => setBookingToDelete(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="flex flex-col gap-6 py-2">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-primary font-medium">Are you absolutely sure?</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              This will permanently remove the reservation and all associated financial records. 
              This action <span className="text-red-600 font-bold uppercase">cannot be undone</span>.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setBookingToDelete(null)}
              className="btn btn-primary flex-1 py-3 text-[11px]"
            >
              No, Keep it
            </button>
            <button 
              onClick={confirmDelete}
              className="btn btn-danger flex-1 py-3 text-[11px]"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
