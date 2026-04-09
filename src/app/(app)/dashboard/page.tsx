'use client';

import React, { useState, useEffect } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import PropertyCard from '@/components/dashboard/PropertyCard';
import { Plus, Building2, MapPin, Bed, ExternalLink, Search, Home, GraduationCap, Warehouse, Coffee } from 'lucide-react';
import Select from '@/components/ui/Select';
import { Property, RoomStatus } from '@/types';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import { getEnrichedRooms, getStoredBookings } from '@/lib/store';
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

  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProperty, setNewProperty] = useState({
    name: '',
    rooms: '',
    address: ''
  });

  const propertyConfig = [
    { id: '010', name: 'The Peace', type: 'bnb' as const },
    { id: '011', name: 'Starry Nights', type: 'hostel' as const },
    { id: '012', name: 'Starry BnB', type: 'airbnb' as const },
  ];

  const initialRooms: Room[] = [];
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

  const [storedRooms, setStoredRooms] = useState<Room[]>(initialRooms);
  const [storedBookings, setStoredBookings] = useState<Record<string, Booking>>({});

  useEffect(() => {
    const loadCache = async () => {
      const enrichedRooms = await getEnrichedRooms(initialRooms);
      const bookings = await getStoredBookings();
      setStoredRooms(enrichedRooms);
      setStoredBookings(bookings);
    };
    loadCache();
    window.addEventListener('storage', loadCache);
    return () => window.removeEventListener('storage', loadCache);
  }, []);

  const mergedRooms = [...storedRooms];
  propertyConfig.forEach(p => {
    if (!mergedRooms.some(r => r.property_id === p.id)) {
      const pRooms = initialRooms.filter(r => r.property_id === p.id);
      mergedRooms.push(...pRooms);
    }
  });

  const searchParams = useSearchParams();
  const propertyFilter = searchParams.get('propertyId');

  const allRooms = propertyFilter 
    ? mergedRooms.filter(r => r.property_id === propertyFilter)
    : mergedRooms;

  const getPropertySummary = (propertyId: string) => {
    const propertyRooms = allRooms.filter(r => r.property_id === propertyId);
    
    return {
      occupied: propertyRooms.filter(r => r.status === 'occupied').length,
      checkout_today: propertyRooms.filter(r => r.status === 'checkout_today').length,
      roomStatusList: propertyRooms.map(r => ({ status: r.status, floor: r.floor }))
    };
  };

  const propertySummaries: Record<string, any> = {
    '010': getPropertySummary('010'),
    '011': getPropertySummary('011'),
    '012': getPropertySummary('012')
  };

  const totalVacant = allRooms.filter(r => r.status === 'vacant').length;

  const properties: Property[] = [
    { id: '010', owner_id: '001', name: 'The Peace', type: 'bnb', city: 'Varanasi', state: 'UP', total_rooms: 9, is_active: true, created_at: '2026-03-10T10:00:00Z' },
    { id: '011', owner_id: '001', name: 'Starry Nights', type: 'hostel', total_rooms: 9, city: 'Varanasi', state: 'UP', is_active: true, created_at: '2025-11-20' },
    { id: '012', owner_id: '001', name: 'Starry BnB', type: 'airbnb', total_rooms: 9, city: 'Varanasi', state: 'UP', is_active: true, created_at: '2026-01-15' }
  ];

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPropertyFilter = propertyFilter ? p.id === propertyFilter : true;
    return matchesSearch && matchesPropertyFilter;
  });

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

  const currentDateTime = format(currentTime, 'EEEE, dd MMM yyyy');

  if (!isMounted) return <div className="p-20 text-center text-ink-muted">Loading dashboard...</div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6 animate-slide-up bg-bg-canvas min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2 w-full">
          <span className="text-[10px] font-medium text-accent uppercase tracking-[0.3em] font-sans flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {currentDateTime}
          </span>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full">
            <h1 className="text-3xl md:text-4xl font-display text-ink-primary tracking-tighter font-medium text-balance">
              {getGreeting()}
            </h1>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-ink-secondary text-[11px] font-sans">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-status-vacant-fg" />
                <span><span className="font-semibold text-ink-primary">{totalVacant}</span> Vacant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-status-occupied-fg" />
                <span><span className="font-semibold text-ink-primary">{allRooms.filter(r => r.status === 'occupied').length}</span> Occupied</span>
              </div>
              <div className="flex items-center gap-2 text-nowrap">
                <div className="w-2 h-2 rounded-full bg-status-arriving-fg" />
                <span><span className="font-semibold text-ink-primary">{allRooms.filter(r => r.status === 'arriving_today').length}</span> Arriving Today</span>
              </div>
              <div className="flex items-center gap-2 text-nowrap">
                <div className="w-2 h-2 rounded-full bg-status-checkout-fg" />
                <span><span className="font-semibold text-ink-primary">{allRooms.filter(r => r.status === 'checkout_today').length}</span> Checking Out</span>
              </div>
              <div className="flex items-center gap-2 text-nowrap">
                <div className="w-2 h-2 rounded-full bg-status-cleaning-fg" />
                <span><span className="font-semibold text-ink-primary">{allRooms.filter(r => r.status === 'cleaning').length}</span> Cleaning</span>
              </div>
              <div className="flex items-center gap-2 text-nowrap">
                <div className="w-2 h-2 rounded-full bg-status-maintenance-fg" />
                <span><span className="font-semibold text-ink-primary">{allRooms.filter(r => r.status === 'maintenance').length}</span> Maint.</span>
              </div>
            </div>
          </div>
        </div>

        {!isReception && (
          <div className="flex items-center gap-8 md:text-right shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">Occupancy</span>
              <span className="text-xl sm:text-2xl font-mono font-medium tracking-tight text-ink-primary">
                {Math.round((allRooms.filter(r => r.status === 'occupied').length / Math.max(1, allRooms.length)) * 100)}%
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">Revenue</span>
              <span className="text-xl sm:text-2xl font-mono font-medium tracking-tight text-ink-primary">
                ₹{allRooms.filter(r => r.status === 'occupied').reduce((acc, curr) => acc + (curr.base_price || 0), 0)}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-2">
        <StatCard 
          label="Total Occupied" 
          value={allRooms.filter(r => r.status === 'occupied').length} 
          subLabel={`of ${allRooms.length} rooms`} 
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
      <section className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-display text-ink-primary font-medium">Your Properties</h2>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input 
                  type="text" 
                  placeholder="Search properties..." 
                  className="input pl-10 h-9 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             {!isReception && !isOwnerRole && (
               <button 
                  onClick={handleAddPropertyClick}
                  className="btn btn-accent btn--sm flex items-center gap-2 group whitespace-nowrap h-9 px-4 text-xs font-semibold"
                >
                  <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                  <span>Add Property</span>
                </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property, idx) => (
            <div key={property.id} className="stagger-item visible" style={{ animationDelay: `${idx * 40}ms` }}>
              <PropertyCard
                property={property}
                summary={propertySummaries[property.id as keyof typeof propertySummaries]}
              />
            </div>
          ))}
          {filteredProperties.length === 0 && (
            <div className="col-span-full py-16 bg-bg-sunken/40 rounded-2xl border border-dashed border-border-subtle flex flex-col items-center justify-center text-center">
               <Building2 size={40} strokeWidth={1} className="text-ink-muted/30 mb-3" />
               <h3 className="text-sm font-semibold text-ink-primary mb-1">No properties found</h3>
               <p className="text-xs text-ink-muted">Try adjusting your search query</p>
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
          <div className="flex gap-2 w-full">
            <button className="btn btn-secondary flex-1 font-semibold" onClick={() => setIsAddPropertyOpen(false)}>Cancel</button>
            <button className="btn btn-accent flex-1 font-semibold" onClick={confirmAddProperty}>Add Property</button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Property Name*</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input type="text" placeholder="e.g. Peace Hotel" className="input pl-10" value={newProperty.name} onChange={e => setNewProperty({...newProperty, name: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select 
              options={[
                { id: 'Hotel', label: 'Hotel', icon: Building2 },
                { id: 'Hostel', label: 'Hostel', icon: Bed },
                { id: 'BnB', label: 'Bed & Breakfast', icon: Coffee }
              ]}
              value="Hotel"
              onChange={() => {}} 
              label="Property Type*"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Total Rooms*</label>
              <div className="relative">
                <Bed size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="number" placeholder="20" className="input pl-10" value={newProperty.rooms} onChange={e => setNewProperty({...newProperty, rooms: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Address</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input type="text" placeholder="Location details..." className="input pl-10" value={newProperty.address} onChange={e => setNewProperty({...newProperty, address: e.target.value})} />
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: Upgrade */}
      <Modal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)}>
        <div className="text-center py-6 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Plus size={24} />
          </div>
          <h3 className="text-lg font-medium">Upgrade to Pro</h3>
          <p className="text-xs text-ink-muted px-6">Manage multiple properties and unlock premium analytics.</p>
          <button className="btn btn-accent w-full font-semibold mt-2" onClick={() => setIsUpgradeOpen(false)}>View Plans</button>
        </div>
      </Modal>
    </div>
  );
}
