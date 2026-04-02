'use client';

import React, { useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import PropertyCard from '@/components/dashboard/PropertyCard';
import { Plus, Building2, MapPin, Bed, ExternalLink, Search, Home, GraduationCap, Warehouse, Coffee } from 'lucide-react';
import Select from '@/components/ui/Select';
import { Property, RoomStatus } from '@/types';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import { getStoredRooms, getStoredBookings } from '@/lib/store';
import { Room, Booking } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNewBooking } from '@/components/booking/NewBookingProvider';
import { parseISO, format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { open: openNewBooking } = useNewBooking();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('stayboard_user_role') || 'owner');
      setUserEmail(localStorage.getItem('stayboard_user_email'));
    }
    return () => clearInterval(timer);
  }, []);

  const isReception = userRole === 'reception';
  const isOwnerRole = userRole === 'owner';
  const isSuperAdmin = userRole === 'superadmin';

  const getGreeting = () => {
    if (userEmail === 'dhagamonish00@gmail.com') return 'Welcome, Admin!';
    if (userRole === 'reception') return 'Welcome, User!';
    if (userRole === 'owner') return 'Welcome, Sudhir!';
    return 'Welcome Back, User!';
  };

  const owner = { 
    name: isReception ? 'Reception' : isSuperAdmin ? 'Monish' : isOwnerRole ? 'Operations Manager' : 'Rajesh', 
    plan: 'pro' 
  };
  const today = 'Friday, 20 Mar 2026';

  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProperty, setNewProperty] = useState({
    name: '',
    rooms: '',
    address: ''
  });

  // Initial 8 rooms for each property if none exist
  const initialRooms: Room[] = [];
  const propertyConfig = [
    { id: '010', name: 'The Peace', type: 'bnb' as const },
    { id: '011', name: 'Starry Nights', type: 'hostel' as const },
    { id: '012', name: 'Starry BnB', type: 'airbnb' as const },
  ];

  propertyConfig.forEach(p => {
    for (let i = 1; i <= 9; i++) {
      let floor = 1;
      if (i <= 3) floor = 1;
      else if (i <= 6) floor = 2;
      else floor = 3;
      
      initialRooms.push({
        id: `${p.id}-${i.toString().padStart(2, '0')}`,
        property_id: p.id,
        room_number: i.toString().padStart(2, '0'),
        room_type: i % 2 === 0 ? 'double' : 'single',
        status: 'vacant',
        base_price: p.type === 'hostel' ? 800 : 1500,
        floor,
        max_occupancy: 2,
        last_status_change: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  });

  const storedRooms = getStoredRooms(initialRooms);
  
  // Ensure we have rooms for all 3 properties by merging if necessary
  const mergedRooms = [...storedRooms];
  propertyConfig.forEach(p => {
    if (!mergedRooms.some(r => r.property_id === p.id)) {
      const pRooms = initialRooms.filter(r => r.property_id === p.id);
      mergedRooms.push(...pRooms);
    }
  });

  const searchParams = useSearchParams();
  const propertyFilter = searchParams.get('propertyId');

  // Filter rooms based on selected property
  const allRooms = propertyFilter 
    ? mergedRooms.filter(r => r.property_id === propertyFilter)
    : mergedRooms;

  const storedBookings = getStoredBookings();

  const getPropertySummary = (propertyId: string) => {
    const propertyRooms = allRooms.filter(r => r.property_id === propertyId);
    
    // Enrich rooms with active booking status
    const enrichedRooms = propertyRooms.map(r => {
      const roomBookings = Object.values(storedBookings).filter(b => b.room_id === r.id);
      const now = new Date();
      const activeBooking = roomBookings.find(b => {
        const start = parseISO(b.check_in_date);
        const end = parseISO(b.check_out_date);
        return (now >= start && now < end);
      });
      
      return {
        ...r,
        currentStatus: activeBooking ? 'occupied' : (r.status === 'occupied' ? 'vacant' : r.status)
      };
    });

    return {
      occupied: enrichedRooms.filter(r => r.currentStatus === 'occupied').length,
      checkout_today: enrichedRooms.filter(r => r.currentStatus === 'checkout_today').length,
      roomStatusList: enrichedRooms.map(r => ({ status: r.currentStatus, floor: r.floor }))
    };
  };

  const propertySummaries: Record<string, any> = {
    '010': getPropertySummary('010'),
    '011': getPropertySummary('011'),
    '012': getPropertySummary('012')
  };

  const totalVacant = allRooms.filter(r => r.status === 'vacant').length;

  // Mock property data
  const properties: Property[] = [
    {
      id: '010',
      owner_id: '001',
      name: 'The Peace',
      type: 'bnb',
      city: 'Varanasi',
      state: 'UP',
      total_rooms: 9,
      is_active: true,
      created_at: '2026-03-10T10:00:00Z'
    },
    {
      id: '011',
      owner_id: '001',
      name: 'Starry Nights',
      type: 'hostel',
      total_rooms: 9,
      address: 'Near Dashashwamedh Ghat',
      city: 'Varanasi',
      state: 'UP',
      is_active: true,
      created_at: '2025-11-20'
    },
    {
      id: '012',
      owner_id: '001',
      name: 'Starry BnB',
      type: 'airbnb',
      total_rooms: 9,
      address: 'Chet Singh Ghat',
      city: 'Varanasi',
      state: 'UP',
      is_active: true,
      created_at: '2026-01-15'
    }
  ];

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPropertyFilter = propertyFilter ? p.id === propertyFilter : true;
    return matchesSearch && matchesPropertyFilter;
  });

  const activePropertyName = propertyFilter 
    ? properties.find(p => p.id === propertyFilter)?.name || 'the property'
    : 'your properties';



  const handleAddPropertyClick = () => {
    if (owner.plan === 'free' && properties.length >= 1) {
      setIsUpgradeOpen(true);
    } else {
      setIsAddPropertyOpen(true);
    }
  };

  const confirmAddProperty = () => {
    toast("Peace Hotel added", "success");
    setIsAddPropertyOpen(false);
  };

  if (!isMounted) return <div className="p-20 text-center text-ink-muted">Loading dashboard...</div>;

  return (
    <div className="p-6 md:p-10 flex flex-col gap-10 max-w-[1440px] mx-auto w-full">
      {/* Hero Header Section */}
      <header className="relative overflow-hidden bg-[linear-gradient(135deg,#60A5FA_0%,#2563EB_50%,#1E40AF_100%)] rounded-[var(--radius-xl)] p-8 md:p-12 text-white shadow-lg group">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
                {format(currentTime, 'EEEE, dd MMM yyyy')}
              </span>
              <span className="text-[10px] font-medium tracking-widest text-white/50">
                {format(currentTime, 'hh:mm:ss a')}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[1.05]">
              {getGreeting()}
            </h1>
            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-white/90 text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span><span className="font-bold text-white tracking-widest">{totalVacant}</span> Vacant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span><span className="font-bold text-white tracking-widest">{allRooms.filter(r => r.status === 'occupied').length}</span> Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span><span className="font-bold text-white tracking-widest">{allRooms.filter(r => r.status === 'arriving_today').length}</span> Check-ins</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span><span className="font-bold text-white tracking-widest">{allRooms.filter(r => r.status === 'checkout_today').length}</span> Check-outs</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 w-full md:w-auto md:items-end">
             {!isReception && (
                <div className="flex items-center justify-between sm:justify-start sm:gap-12 md:text-right">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Occupancy</span>
                    <span className="text-2xl sm:text-3xl font-mono font-semibold tracking-tight">
                      {Math.round((allRooms.filter(r => r.status === 'occupied').length / Math.max(1, allRooms.length)) * 100)}%
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Revenue</span>
                    <span className="text-2xl sm:text-3xl font-mono font-semibold tracking-tight">
                      ₹{allRooms.filter(r => r.status === 'occupied').reduce((acc, curr) => acc + (curr.base_price || 0), 0)}
                    </span>
                  </div>
                </div>
             )}
              {propertyFilter && (
                <button 
                  onClick={() => openNewBooking()}
                  className="bg-white text-accent px-6 sm:px-8 py-4 rounded-full font-bold text-sm shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn whitespace-nowrap"
                >
                  <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
                  <span className="whitespace-nowrap">New Booking</span>
                </button>
              )}
          </div>
        </div>
      </header>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-2">
        <StatCard 
          label="Total Occupied" 
          value={allRooms.filter(r => r.status === 'occupied').length} 
          subLabel={`of ${allRooms.length} rooms tonight`} 
          href="/reports?filter=occupied" 
          accentColor="blue" 
        />
        <StatCard 
          label="Checking In" 
          value={allRooms.filter(r => r.status === 'arriving_today').length} 
          subLabel="arrivals today" 
          href="/reports?filter=arrivals" 
          accentColor="purple" 
        />
        <StatCard 
          label="Checking Out" 
          value={allRooms.filter(r => r.status === 'checkout_today').length} 
          subLabel="departures today" 
          href="/reports?filter=check_out" 
          accentColor="orange" 
        />
        <StatCard 
          label="Vacant Tonight" 
          value={totalVacant} 
          subLabel="available" 
          href="/reports?filter=vacant" 
          accentColor="green" 
        />

        {!isReception && (
          <StatCard
            label="Today's Revenue"
            value={0}
            isCurrency
            subLabel="UPI + Cash"
            accentColor="blue"
            trend={{ value: '0%', type: 'up' }}
            href="/reports?period=today"
          />
        )}
      </div>

      {/* Properties Section */}
      <section className="flex flex-col gap-6 mt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-display text-ink-primary">Your Properties</h2>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input 
                  type="text" 
                  placeholder={searchQuery ? "" : "Search properties..."} 
                  className="input pl-12 h-10 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             {!isReception && !isOwnerRole && (
               <button 
                  onClick={handleAddPropertyClick}
                  className="btn btn-accent btn--sm flex items-center gap-2 group whitespace-nowrap h-10 px-4"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  <span>Add Property</span>
                </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProperties.map((property, idx) => (
            <div key={property.id} className="stagger-item visible" style={{ animationDelay: `${idx * 60}ms` }}>
              <PropertyCard
                property={property}
                summary={propertySummaries[property.id as keyof typeof propertySummaries]}
              />
            </div>
          ))}
          {filteredProperties.length === 0 && (
            <div className="col-span-full py-20 bg-bg-sunken/40 rounded-3xl border border-dashed border-border-subtle flex flex-col items-center justify-center text-center">
               <Building2 size={48} strokeWidth={1} className="text-ink-muted/30 mb-4" />
               <h3 className="text-lg font-bold text-ink-primary mb-1">No properties found</h3>
               <p className="text-sm text-ink-muted">Try adjusting your search query</p>
            </div>
          )}
        </div>
      </section>

      {/* MODAL: Add Property */}
      <Modal 
        isOpen={isAddPropertyOpen} 
        onClose={() => setIsAddPropertyOpen(false)}
        title="Add New Property"
        footer={
          <>
            <button className="btn btn-ghost md:w-auto" onClick={() => setIsAddPropertyOpen(false)}>Cancel</button>
            <button className="btn btn-accent px-8" onClick={confirmAddProperty}>Add Property</button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Property Name*</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input type="text" placeholder={newProperty.name ? "" : "e.g. Peace Hotel"} className="input pl-10" value={newProperty.name} onChange={e => setNewProperty({...newProperty, name: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select 
              options={[
                { id: 'Hotel', label: 'Hotel', icon: Building2, description: 'Standard Lodging' },
                { id: 'Hostel', label: 'Hostel', icon: Bed, description: 'Backpacker / Dorms' },
                { id: 'BnB', label: 'Bed & Breakfast', icon: Coffee, description: 'Home Stay' },
                { id: 'Guesthouse', label: 'Guesthouse', icon: Warehouse, description: 'Private Unit' }
              ]}
              value={newProperty.name ? 'Hotel' : 'Hotel'} // placeholder logic for demo
              onChange={() => {}} // dummy for now as it doesn't have a state field
              label="Property Type*"
              className="flex-1"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Total Rooms*</label>
              <div className="relative">
                <Bed size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="number" placeholder={newProperty.rooms ? "" : "20"} className="input pl-10" value={newProperty.rooms} onChange={e => setNewProperty({...newProperty, rooms: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Address</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input type="text" placeholder={newProperty.address ? "" : "Assi Ghat, Near..."} className="input pl-10" value={newProperty.address} onChange={e => setNewProperty({...newProperty, address: e.target.value})} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">City</label>
            <input type="text" defaultValue="Varanasi" className="input" />
          </div>
        </div>
      </Modal>

      {/* MODAL: Upgrade to Pro */}
      <Modal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        className="max-w-[400px]"
      >
        <div className="flex flex-col items-center text-center gap-6 py-4">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Plus size={32} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-display text-ink-primary">Upgrade to Pro</h3>
            <p className="text-sm text-ink-muted px-4">Free plan supports 1 property. Upgrade to Pro for unlimited properties and deep analytics.</p>
          </div>
          <div className="flex flex-col w-full gap-3 mt-2">
            <Link 
              href="/settings#billing" 
              className="btn btn-accent w-full flex items-center justify-center gap-2"
              onClick={() => setIsUpgradeOpen(false)}
            >
              <span>Upgrade Now — ₹1,999/mo</span>
              <ExternalLink size={16} />
            </Link>
            <button className="btn btn-ghost w-full" onClick={() => setIsUpgradeOpen(false)}>Not now</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
