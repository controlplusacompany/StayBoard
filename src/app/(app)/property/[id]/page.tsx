'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronRight, Plus, X, Bed, Layers, IndianRupee, Users, Tent, Coffee, ArrowRight } from 'lucide-react';
import Select from '@/components/ui/Select';
import RoomCard from '@/components/rooms/RoomCard';
import { Room, RoomStatus, Booking, PropertyType } from '@/types';
import Badge from '@/components/ui/Badge';
import RoomDrawer from '@/components/rooms/RoomDrawer';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

import { getEnrichedRooms, getStoredBookings, getBookingsForRoom, getSelectedProperty, setSelectedProperty, getArrivalsToday } from '@/lib/store';
import { format, parseISO, isWithinInterval, isSameDay, differenceInDays } from 'date-fns';
import { useRealtime } from '@/hooks/useRealtime';
import { useNewBooking } from '@/components/booking/NewBookingProvider';

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { open: openNewBooking } = useNewBooking();

  const [activeTab, setActiveTab] = useState<RoomStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Sync Master Property on visit
  useEffect(() => {
    if (params.id) {
      setSelectedProperty(params.id);
    }
  }, [params.id]);

  // Auto-Redirect logic for Master Property sync
  useEffect(() => {
    const checkRedirect = () => {
      const globalPropId = getSelectedProperty();
      // Only redirect if a SPECIFIC property is selected globally and it's NOT this one.
      // If 'All Properties' (null or 'all') is selected, stay on this page.
      if (globalPropId && globalPropId !== 'all' && globalPropId !== params.id) {
        // If we are on a property page, we usually WANT to stay there.
        // But if the user used the Navbar switcher, we should redirect.
        // However, setting it in the other useEffect above might cause a loop if not careful.
      }
    };

    checkRedirect();
    window.addEventListener('storage', checkRedirect);
    return () => window.removeEventListener('storage', checkRedirect);
  }, [params.id, router]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('stayboard_user_role'));
    }
  }, []);

  const isReception = userRole === 'reception';
  const isOwnerRole = userRole === 'owner';

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    number: '',
    floor: '',
    occupancy: '',
    price: '',
    bed: ''
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [mockBookings, setMockBookings] = useState<Record<string, Booking>>({});
  const [arrivals, setArrivals] = useState<Booking[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = async () => {
    const [allEnrichedRooms, fetchedBookings, arrivalsToday] = await Promise.all([
      getEnrichedRooms(),
      getStoredBookings(),
      getArrivalsToday(params.id)
    ]);

    // Convert both to strings for safety
    const filteredRooms = allEnrichedRooms.filter(r => String(r.property_id) === String(params.id));

    setRooms(filteredRooms);
    setMockBookings(fetchedBookings);
    setArrivals(arrivalsToday);
    setDataLoaded(true);
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('storage', refreshData);

    // Handle highlight from Dashboard
    const highlight = searchParams.get('highlight');
    if (highlight === 'arrivals') setActiveTab('arriving_today');
    else if (highlight === 'checkouts') setActiveTab('checkout_today');
    else if (highlight === 'vacant') setActiveTab('vacant');

    return () => window.removeEventListener('storage', refreshData);
  }, [searchParams]);

  // Supabase Realtime Sync
  useRealtime(refreshData);

  const [property, setProperty] = useState<{ id: string; name: string; type: PropertyType; city: string; total_rooms: number }>({
    id: params.id,
    name: '',
    type: 'hotel',
    city: '',
    total_rooms: 0
  });

  useEffect(() => {
    const fetchProperty = async () => {
      const { data } = await (await import('@/lib/supabase')).supabase
        .from('properties')
        .select('*')
        .eq('id', params.id)
        .single();
      if (data) {
        setProperty({
          id: data.id,
          name: data.name,
          type: data.type as PropertyType,
          city: data.city,
          total_rooms: data.total_rooms
        });
      }
    };
    fetchProperty();
  }, [params.id]);

  const isHostel = property.type === 'hostel';

  const filteredRooms = rooms.filter(room => {
    // Get bookings from local state instead of async store call
    const bookings = Object.values(mockBookings).filter(b => b.room_id === room.id && b.status !== 'cancelled' && b.status !== 'no_show');
    const guestNames = bookings.map(b => b.guest_name.toLowerCase());

    let matchesTab = true;
    if (activeTab === 'all') matchesTab = true;
    else matchesTab = room.status === activeTab;

    const matchesSearch = room.room_number.includes(searchQuery) ||
      guestNames.some(name => name.includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const getCount = (tabId: string) => {
    if (tabId === 'all') return rooms.length;
    return rooms.filter(r => r.status === tabId).length;
  };

  const tabs: { id: RoomStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'vacant', label: 'Vacant' },
    { id: 'occupied', label: 'Occupied' },
    { id: 'arriving_today', label: 'Arrivals' },
    { id: 'checkout_today', label: 'Checkouts' },
    { id: 'cleaning', label: 'Cleaning' },
    { id: 'maintenance', label: 'Maintenance' },
  ];

  const handleRoomClick = (roomId: string) => {
    setSelectedRoomId(roomId);
    setIsDrawerOpen(true);
  };

  const handleAddRoom = () => {
    toast("Room 105 added", "success");
    setIsAddRoomOpen(false);
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedBookings = selectedRoom ? Object.values(mockBookings).filter(b => b.room_id === selectedRoom.id && b.status !== 'cancelled' && b.status !== 'no_show') : [];

  // Find active booking for today to show in the drawer (including Check-ins and Check-outs)
  const activeBooking = selectedBookings.find(b => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localToday = new Date(now.getTime() - offset).toISOString().split('T')[0];
    const bStart = b.check_in_date.split('T')[0];
    const bEnd = b.check_out_date.split('T')[0];

    // Priority 1: Currently staying (localToday >= start AND localToday < end)
    const isStaying = (b.status === 'checked_in' && localToday >= bStart && localToday < bEnd);
    // Priority 2: Checking out today (localToday === end)
    const isCheckingOut = (b.status === 'checked_in' && localToday === bEnd);
    // Priority 3: Arriving today (localToday === start)
    const isArriving = ((b.status === 'assigned' || b.status === 'unassigned') && localToday === bStart);

    return isStaying || isCheckingOut || isArriving;
  });

  const selectedRoomWithBooking = selectedRoom ? {
    ...selectedRoom,
    booking: activeBooking,
    bookings: selectedBookings // Pass ALL bookings for the 30-day bar
  } : null;

  if (!dataLoaded) return (
    <div className="p-6 md:p-10 flex flex-col gap-6 animate-pulse bg-bg-canvas min-h-full">
      <div className="flex flex-col gap-3">
        <div className="h-3 w-40 bg-bg-sunken rounded" />
        <div className="h-10 w-64 bg-bg-sunken rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-bg-sunken rounded-xl" />)}
      </div>
      <div className="h-14 bg-bg-sunken rounded-xl mt-4" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-bg-sunken rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <>
      <div className={`transition-all duration-350 ease-out h-full overflow-hidden ${isDrawerOpen ? 'drawer-scale-content drawer-scale-content--active' : 'drawer-scale-content'}`}>
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col h-full gap-4">

          {/* Breadcrumb & Global Actions */}
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-2 text-[12px] font-sans text-ink-muted">
              <Link
                href="/dashboard"
                onClick={() => {
                  if (typeof window !== 'undefined' && isOwnerRole) {
                    localStorage.removeItem('stayboard_master_property');
                    window.dispatchEvent(new Event('stayboard_update'));
                  }
                }}
                className="hover:text-accent transition-colors"
              >
                Dashboard
              </Link>
              <ChevronRight size={14} />
              <span className="text-ink-secondary font-medium">{property.name}</span>
            </nav>

            <button
              onClick={openNewBooking}
              className="btn btn-accent flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-accent/20 animate-in slide-in-from-right-4 duration-500"
            >
              <Plus size={18} />
              <span>New Booking</span>
            </button>
          </div>

          {/* KPI DASHBOARD */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-2">
            {[
              { label: 'Total Occupied', value: getCount('occupied'), sub: `of ${rooms.length} rooms tonight`, border: 'var(--status-occupied-border)' },
              { label: 'Checking In', value: getCount('arriving_today'), sub: 'arrivals today', border: 'var(--status-arriving-border)' },
              { label: 'Checking Out', value: getCount('checkout_today'), sub: 'departures today', border: 'var(--status-checkout-border)' },
              { label: 'Vacant Tonight', value: getCount('vacant'), sub: 'available', border: 'var(--status-vacant-border)' },
              { label: "Today's Revenue", value: `₹${Object.values(mockBookings).filter(b => isSameDay(parseISO(b.check_in_date), new Date())).reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0).toLocaleString()}`, sub: 'UPI + Cash', border: 'var(--accent)', isRevenue: true }
            ].filter(kpi => !isReception || !kpi.isRevenue).map((kpi, i) => (
              <div key={i} className="bg-white border border-border-subtle rounded-lg p-3 sm:p-4 shadow-xs border-l-4 flex flex-col gap-1 sm:gap-2 transition-all hover:shadow-md duration-300" style={{ borderLeftColor: kpi.border }}>
                <span className="text-[9px] sm:text-[10px] font-semibold text-ink-muted uppercase tracking-widest">{kpi.label}</span>
                <div className="flex flex-col">
                  <span className={`text-xl sm:text-2xl font-display font-semibold text-ink-primary ${kpi.isRevenue ? 'font-mono' : ''}`}>{kpi.value}</span>
                  <span className="text-[10px] text-ink-muted font-medium mt-0.5">
                    {kpi.sub} {kpi.isRevenue && <span className="text-success font-semibold ml-1">↗ 0%</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ARRIVALS TODAY SECTION */}
          {arrivals.length > 0 && (
            <section className="flex flex-col gap-4 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display text-ink-primary font-semibold">Arrivals Today</h2>
                <Link href="/reservations" className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1.5 group transition-all">
                  View guest list <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 no-scrollbar">
                {arrivals.map(booking => {
                  const checkIn = parseISO(booking.check_in_date);
                  const checkOut = parseISO(booking.check_out_date);
                  const nights = differenceInDays(checkOut, checkIn) || 1;
                  const room = rooms.find(r => r.id === booking.room_id);

                  return (
                    <div
                      key={booking.id}
                      className="min-w-[320px] bg-white border border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col relative group transition-all"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: 'var(--status-arriving-border)' }} />
                      <div className="p-4 flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-bold text-ink-primary tracking-tight leading-tight">{booking.guest_name}</h3>
                            <p className="text-[12px] font-medium text-ink-secondary">
                              {(!room || booking.status === 'unassigned') ? 'Double Room (Unassigned)' : `Room ${room.room_number}`} • {nights} {nights === 1 ? 'night' : 'nights'}
                            </p>
                          </div>
                          <div className="bg-blue-50 text-[9px] font-bold text-blue-600 px-2.5 py-1 rounded-md uppercase tracking-wide border border-blue-100">
                            {booking.booking_source?.replace('_', '.') || 'Booking.com'}
                          </div>
                        </div>

                        <div className="flex items-end justify-between pt-1">
                          {!isReception ? (
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.2em]">ADVANCE PAID</span>
                              <span className="text-xl font-bold text-ink-primary mt-1 tracking-tight">₹{booking.amount_paid}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.2em]">CONTACT NO</span>
                              <span className="text-sm font-mono font-bold text-ink-primary mt-1 tracking-tight">{booking.guest_phone}</span>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `/booking/new?booking_id=${booking.id}&property=${params.id}`;
                              router.push(url);
                            }}
                            className="btn btn-accent btn--sm px-5 text-xs shadow-md"
                          >
                            Check In
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-[24px] md:text-2xl font-display text-ink-primary font-medium">{property.name}</h1>
                <Badge type={property.type} label={property.type} />
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <span>{property.city}</span>
                <span>•</span>
                <span>{property.total_rooms} rooms total</span>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isReception && !isOwnerRole && (
                <button
                  onClick={() => setIsAddRoomOpen(true)}
                  className="btn btn-accent flex items-center justify-center gap-2 group"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  <span>Add Room</span>
                </button>
              )}
              <div className="bg-bg-sunken px-3 py-1.5 rounded-md border border-border-subtle text-xs font-medium text-ink-secondary hidden sm:block">

              </div>
            </div>
          </header>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-y border-border-subtle py-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-ink-primary text-white shadow-md'
                      : 'bg-transparent text-ink-secondary border border-border-subtle hover:bg-bg-sunken'}
                  `}
                >
                  {tab.label}
                  <span className={`text-[11px] opacity-70 ${activeTab === tab.id ? 'text-white' : 'text-ink-muted'}`}>
                    ({getCount(tab.id)})
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-[240px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder={searchQuery ? "" : "Search room or guest..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input--sm pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Room Layout - Grouped by Floor if it's The Peace */}
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-6 py-2">
            {Object.keys(
              filteredRooms.reduce((acc, r) => {
                const f = String(r.floor ?? '1');
                if (!acc[f]) acc[f] = [];
                acc[f].push(r);
                return acc;
              }, {} as Record<string, Room[]>)
            ).sort((a, b) => {
              const numA = a === '0' ? 999 : parseInt(a);
              const numB = b === '0' ? 999 : parseInt(b);
              if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
              if (isNaN(numA)) return 1;
              if (isNaN(numB)) return -1;
              return numA - numB;
            }).map((floor) => {
              const floorRooms = filteredRooms.filter(r => String(r.floor ?? '1') === String(floor));
              if (floorRooms.length === 0) return null;

              return (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-bg-sunken px-2 py-1 rounded-md border border-border-subtle flex items-center gap-2">
                      <Layers size={12} className="text-ink-muted" />
                      <h2 className="text-[10px] font-medium text-ink-secondary uppercase tracking-[0.15em]">
                        {floor === '0' ? 'Dorm Area' : `Floor ${floor}`}
                      </h2>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-border-subtle to-transparent" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {floorRooms.map((room, idx) => {
                      const now = new Date();
                      return (
                        <div
                          key={room.id}
                          className="stagger-item visible"
                          style={{ animationDelay: `${idx * 40}ms` }}
                        >
                          <RoomCard
                            room={room}
                            status={room.status}
                            futureBooking={(room as any).future_booking}
                            onClick={handleRoomClick}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="mt-auto py-6 border-t border-border-subtle flex flex-wrap gap-x-8 gap-y-3 justify-center items-center bg-bg-surface/50 rounded-b-3xl">
            {[
              { id: 'occupied', label: 'Occupied', color: 'bg-status-occupied-fg' },
              { id: 'arriving_today', label: 'Arriving Today', color: 'bg-status-arriving-fg' },
              { id: 'checkout_today', label: 'Checking Out', color: 'bg-status-checkout-fg' },
              { id: 'cleaning', label: 'Cleaning', color: 'bg-status-cleaning-fg' },
              { id: 'maintenance', label: 'Maintenance', color: 'bg-status-maintenance-fg' },
              { id: 'vacant', label: 'Vacant', color: 'bg-status-vacant-fg' },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-[10px] text-ink-muted uppercase tracking-[0.2em] font-medium">
                <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm border border-black/5`} />
                <span>{item.label}</span>
              </div>
            ))}
          </footer>
        </div>
      </div>

      {/* MODAL: Add Room */}
      <Modal
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        title="Add New Room"
        footer={
          <>
            <button className="btn btn-secondary px-8 shadow-sm" onClick={() => setIsAddRoomOpen(false)}>Cancel</button>
            <button className="btn btn-accent shadow-lg shadow-accent/20" onClick={handleAddRoom}>Add Room</button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Room Number*</label>
            <input type="text" placeholder={newRoom.number ? "" : "105"} className="input" value={newRoom.number} onChange={e => setNewRoom({ ...newRoom, number: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Price per Night*</label>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input type="number" placeholder={newRoom.price ? "" : "1200"} className="input pl-10" value={newRoom.price} onChange={e => setNewRoom({ ...newRoom, price: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

      {/* Room Detail Drawer */}
      <RoomDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          refreshData();
        }}
        room={selectedRoomWithBooking}
      />
    </>
  );
}
