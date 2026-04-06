'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, ChevronRight, Plus, X, Bed, Layers, IndianRupee, Users, Tent, Coffee } from 'lucide-react';
import Select from '@/components/ui/Select';
import RoomCard from '@/components/rooms/RoomCard';
import { Room, RoomStatus, Booking, PropertyType } from '@/types';
import Badge from '@/components/ui/Badge';
import RoomDrawer from '@/components/rooms/RoomDrawer';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

import { getEnrichedRooms, getStoredBookings, getBookingsForRoom } from '@/lib/store';
import { format, parseISO, isWithinInterval, isSameDay } from 'date-fns';

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<RoomStatus | 'all' | 'dorms' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
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

  const defaultRooms: Room[] = Array.from({ length: 9 }, (_, i) => {
    const roomNum = i + 1;
    let floor = 1;
    if (roomNum <= 3) floor = 1;
    else if (roomNum <= 6) floor = 2;
    else floor = 3;
    
    return {
      id: `${params.id}-${roomNum.toString().padStart(2, '0')}`,
      property_id: params.id,
      room_number: roomNum.toString().padStart(2, '0'),
      room_type: roomNum % 2 === 0 ? 'double' : 'single',
      floor,
      base_price: params.id === '011' ? 800 : 1500,
      max_occupancy: 2,
      status: 'vacant',
      last_status_change: '',
      updated_at: ''
    };
  });

  const defaultBookings: Record<string, Booking> = {};

  const [rooms, setRooms] = useState<Room[]>([]);
  const [mockBookings, setMockBookings] = useState<Record<string, Booking>>({});

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRooms(getEnrichedRooms(defaultRooms));
    setMockBookings(getStoredBookings(defaultBookings));
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

  const property = {
    id: params.id,
    name: params.id === '010' ? 'The Peace' : params.id === '011' ? 'Starry Nights' : 'Starry BnB',
    type: params.id === '010' ? 'bnb' : params.id === '011' ? 'hostel' : 'airbnb' as PropertyType,
    city: 'Varanasi',
    total_rooms: 9
  };

  const isHostel = property.type === 'hostel';

  const filteredRooms = rooms.filter(room => {
    const bookings = getBookingsForRoom(room.id);
    const guestNames = bookings.map(b => b.guest_name.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === 'all') matchesTab = true;
    else if (activeTab === 'dorms') matchesTab = room.room_type === 'dormitory';
    else if (activeTab === 'private') matchesTab = room.room_type !== 'dormitory';
    else matchesTab = room.status === activeTab;

    const matchesSearch = room.room_number.includes(searchQuery) ||
      guestNames.some(name => name.includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const getCount = (tabId: string) => {
    if (tabId === 'all') return rooms.length;
    if (tabId === 'dorms') return rooms.filter(r => r.room_type === 'dormitory').length;
    if (tabId === 'private') return rooms.filter(r => r.room_type !== 'dormitory').length;
    return rooms.filter(r => r.status === tabId).length;
  };

  const tabs: { id: RoomStatus | 'all' | 'dorms' | 'private'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'vacant', label: 'Vacant' },
    { id: 'occupied', label: 'Occupied' },
    { id: 'arriving_today', label: 'Arrivals' },
    { id: 'checkout_today', label: 'Checkouts' },
    { id: 'cleaning', label: 'Cleaning' },
    { id: 'maintenance', label: 'Maintenance' },
  ];

  if (isHostel) {
    tabs.push({ id: 'dorms', label: 'Dorms' });
    tabs.push({ id: 'private', label: 'Private' });
  }

  const handleRoomClick = (roomId: string) => {
    setSelectedRoomId(roomId);
    setIsDrawerOpen(true);
  };

  const handleAddRoom = () => {
    toast("Room 105 added", "success");
    setIsAddRoomOpen(false);
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedBookings = selectedRoom ? getBookingsForRoom(selectedRoom.id) : [];
  
  // Find active booking for today to show in the drawer
  const activeBooking = selectedBookings.find(b => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localToday = new Date(now.getTime() - offset).toISOString().split('T')[0];
    const bStart = b.check_in_date.split('T')[0];
    const bEnd = b.check_out_date.split('T')[0];
    return (localToday >= bStart && localToday < bEnd);
  });
  
  const selectedRoomWithBooking = selectedRoom ? {
    ...selectedRoom,
    booking: activeBooking
  } : null;

  return (
    <>
      <div className={`transition-all duration-350 ease-out h-full overflow-hidden ${isDrawerOpen ? 'drawer-scale-content drawer-scale-content--active' : 'drawer-scale-content'}`}>
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col h-full gap-4">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[12px] font-sans text-ink-muted">
            <Link href="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
            <ChevronRight size={14} />
            <span className="text-ink-secondary font-medium">{property.name}</span>
          </nav>

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
                className="btn btn-accent btn--sm flex-1 sm:flex-none flex items-center justify-center gap-2 group h-10"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                <span>Add Room</span>
              </button>
            )}
              <div className="bg-bg-sunken px-3 py-1.5 rounded-md border border-border-subtle text-xs font-medium text-ink-secondary hidden sm:block">
                20 Mar 2026
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
                const f = r.floor || 1;
                if (!acc[f]) acc[f] = [];
                acc[f].push(r);
                return acc;
              }, {} as Record<number, Room[]>)
            ).sort((a, b) => Number(a) - Number(b)).map((floorStr) => {
              const floor = Number(floorStr);
              const floorRooms = filteredRooms.filter(r => (r.floor || 1) === floor);
              if (floorRooms.length === 0) return null;

              return (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-bg-sunken px-2 py-1 rounded-md border border-border-subtle flex items-center gap-2">
                         <Layers size={12} className="text-ink-muted" />
                         <h2 className="text-[10px] font-medium text-ink-secondary uppercase tracking-[0.15em]">Floor {floor}</h2>
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-border-subtle to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {floorRooms.map((room, idx) => {
                      const bookings = getBookingsForRoom(room.id);
                      const now = new Date();
                      
                      const currentBooking = bookings.find(b => {
                        const start = parseISO(b.check_in_date);
                        const end = parseISO(b.check_out_date);
                        // Room is occupied if we are between check-in and check-out
                        return (now >= start && now < end);
                      });

                      const arrivalToday = bookings.find(b => isSameDay(parseISO(b.check_in_date), now));
                      const checkoutToday = bookings.find(b => isSameDay(parseISO(b.check_out_date), now));

                      const nextBooking = bookings
                        .filter(b => parseISO(b.check_in_date) > now)
                        .sort((a, b) => parseISO(a.check_in_date).getTime() - parseISO(b.check_in_date).getTime())[0];
                        
                      // Determine effective status for display
                      let displayStatus: RoomStatus = room.status;
                      if (currentBooking) displayStatus = 'occupied';
                      else if (arrivalToday) displayStatus = 'arriving_today';
                      else if (checkoutToday) displayStatus = 'checkout_today';

                      return (
                        <div
                          key={room.id}
                          className="stagger-item visible"
                          style={{ animationDelay: `${idx * 40}ms` }}
                        >
                          <RoomCard
                            room={room}
                            status={displayStatus}
                            currentBooking={currentBooking}
                            arrivalToday={arrivalToday}
                            checkoutToday={checkoutToday}
                            hasBalance={((currentBooking || arrivalToday || checkoutToday)?.total_amount || 0) > ((currentBooking || arrivalToday || checkoutToday)?.amount_paid || 0)}
                            futureBooking={nextBooking ? `Next: ${format(parseISO(nextBooking.check_in_date), 'd MMM')}` : undefined}
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
            <button className="btn btn-accent px-10 shadow-lg shadow-accent/20" onClick={handleAddRoom}>Add Room</button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Room Number*</label>
              <input type="text" placeholder={newRoom.number ? "" : "105"} className="input" value={newRoom.number} onChange={e => setNewRoom({...newRoom, number: e.target.value})} />
            </div>
            <Select 
              options={[
                { id: 'Single', label: 'Single Room', icon: Bed, description: '1 Person' },
                { id: 'Double', label: 'Double Room', icon: Users, description: '2 Persons' },
                { id: 'Suite', label: 'Suite Room', icon: Layers, description: 'Premium Space' },
                { id: 'Dormitory Bed', label: 'Dormitory Bed', icon: Tent, description: 'Hostel Style' }
              ]}
              value={newRoom.bed} // reusing bed field as a proxy or I should add a type field to newRoom
              onChange={(val) => setNewRoom({...newRoom, bed: val})}
              label="Room Type*"
              className="flex-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Floor</label>
              <div className="relative">
                <Layers size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="number" placeholder={newRoom.floor ? "" : "1"} className="input pl-10" value={newRoom.floor} onChange={e => setNewRoom({...newRoom, floor: e.target.value})} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Max Occupancy</label>
              <input type="number" placeholder={newRoom.occupancy ? "" : "2"} className="input" value={newRoom.occupancy} onChange={e => setNewRoom({...newRoom, occupancy: e.target.value})} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Price per Night*</label>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input type="number" placeholder={newRoom.price ? "" : "1200"} className="input pl-10" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} />
            </div>
          </div>

          {isHostel && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Bed Number (Dorms Only)</label>
              <div className="relative">
                <Bed size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="text" placeholder={newRoom.bed ? "" : "A1"} className="input pl-10" value={newRoom.bed} onChange={e => setNewRoom({...newRoom, bed: e.target.value})} />
              </div>
            </div>
          )}
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
