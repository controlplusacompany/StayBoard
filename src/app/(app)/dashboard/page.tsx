'use client';

import React, { useState, useEffect } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import PropertyCard from '@/components/dashboard/PropertyCard';
import { Plus, Building2, MapPin, Bed, ExternalLink, Search, Home, GraduationCap, Warehouse, Coffee, ArrowRight, User, CreditCard } from 'lucide-react';
import Select from '@/components/ui/Select';
import { Property, RoomStatus } from '@/types';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import { getEnrichedRooms, getStoredBookings, getSelectedProperty, getArrivalsToday, updateRoomStatus, getVacantRooms, getStoredProperties, updateBookingStatus } from '@/lib/store';
import { Room, Booking } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNewBooking } from '@/components/booking/NewBookingProvider';
import { parseISO, format, isSameDay, differenceInDays } from 'date-fns';
import Badge from '@/components/ui/Badge';

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

  const [properties, setProperties] = useState<Property[]>([]);
  const [storedRooms, setStoredRooms] = useState<Room[]>([]);
  const [storedBookings, setStoredBookings] = useState<Record<string, Booking>>({});
  const [arrivals, setArrivals] = useState<Booking[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);

  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProperty, setNewProperty] = useState({
    name: '',
    rooms: '',
    address: ''
  });

  useEffect(() => {
    const loadCache = async () => {
      const currentFilter = getSelectedProperty();
      setPropertyFilter(currentFilter);
      
      const [enrichedRooms, bookings, arrivalsToday, fetchedProps] = await Promise.all([
        getEnrichedRooms(),
        getStoredBookings(),
        getArrivalsToday(),
        getStoredProperties()
      ]);
      
      setStoredRooms(enrichedRooms);
      setStoredBookings(bookings);
      setArrivals(arrivalsToday);
      setProperties(fetchedProps as Property[]);
      setDataLoaded(true);
    };
    loadCache();
    window.addEventListener('storage', loadCache);
    return () => window.removeEventListener('storage', loadCache);
  }, []);

  const allRooms = propertyFilter 
    ? storedRooms.filter(r => r.property_id === propertyFilter)
    : storedRooms;

  const getPropertySummary = (propertyId: string) => {
    const propertyRooms = storedRooms.filter(r => r.property_id === propertyId);
    
    return {
      occupied: propertyRooms.filter(r => r.status === 'occupied').length,
      checkout_today: propertyRooms.filter(r => r.status === 'checkout_today').length,
      roomStatusList: propertyRooms.map(r => ({ status: r.status, floor: r.floor, name: r.name }))
    };
  };

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.city?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesPropertyFilter = propertyFilter ? p.id === propertyFilter : true;
    
    // STAFF RESTRICTION: Staff only sees their assigned property
    const staffPropertyId = typeof window !== 'undefined' ? localStorage.getItem('stayboard_user_property') : null;
    if (userRole === 'reception' && staffPropertyId && p.id !== staffPropertyId) return false;

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

  if (!isMounted || !dataLoaded) return (
    <div className="p-6 md:p-8 flex flex-col gap-10 animate-pulse bg-bg-canvas min-h-screen">
      <div className="flex flex-col gap-4">
        <div className="h-4 w-32 bg-bg-sunken rounded opacity-60" />
        <div className="h-12 w-80 bg-bg-sunken rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="h-28 bg-bg-sunken rounded-2xl" />
            <div className="h-4 w-2/3 bg-bg-sunken rounded opacity-40 mx-auto" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 bg-bg-sunken rounded-3xl" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6 animate-slide-up bg-bg-canvas min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 w-full">
            <h1 className="text-3xl md:text-4xl font-display text-ink-primary tracking-tighter font-medium text-balance">
              {getGreeting()}
            </h1>
          </div>
        </div>

        {!isReception && (
          <div className="flex items-center gap-8 text-right shrink-0">
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[10px] font-medium uppercase tracking-widest text-ink-muted">Occupancy</span>
              <span className="text-xl sm:text-2xl font-mono font-medium tracking-tight text-ink-primary">
                {Math.round((allRooms.filter(r => r.status === 'occupied').length / Math.max(1, allRooms.length)) * 100)}%
              </span>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[10px] font-medium uppercase tracking-widest text-ink-muted">Revenue</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-mono font-medium tracking-tight text-ink-primary">
                  ₹{Object.values(storedBookings)
                    .filter(b => isSameDay(parseISO(b.check_in_date), new Date()))
                    .filter(b => !propertyFilter || b.property_id === propertyFilter)
                    .reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0)}
                </span>
                <span className="text-[11px] font-bold text-success">↗ 0%</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* GLOBAL KPI DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-2">
            {[
              { label: 'Vacant Rooms', value: allRooms.filter(r => r.status === 'vacant').length, sub: 'Available tonight', border: 'border-l-success' },
              { label: 'Occupied Rooms', value: allRooms.filter(r => r.status === 'occupied').length, sub: 'Currently in-stay', border: 'border-l-accent' },
              { label: 'Check-ins Today', value: Object.values(storedBookings).filter(b => isSameDay(parseISO(b.check_in_date), new Date())).filter(b => !propertyFilter || b.property_id === propertyFilter).length, sub: 'Arriving guests', border: 'border-l-info' },
              { label: 'Check-outs Today', value: Object.values(storedBookings).filter(b => isSameDay(parseISO(b.check_out_date), new Date())).filter(b => !propertyFilter || b.property_id === propertyFilter).length, sub: 'Departing guests', border: 'border-l-warning' },
              { label: "Revenue Today", value: `₹${Object.values(storedBookings).filter(b => isSameDay(parseISO(b.check_in_date), new Date())).filter(b => !propertyFilter || b.property_id === propertyFilter).reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0).toLocaleString()}`, sub: 'Collected today', border: 'border-l-primary', isRevenue: true }
            ].map((kpi, i) => (
              <div key={i} className={`bg-white border border-border-subtle rounded-lg p-3 sm:p-4 shadow-xs border-l-4 ${kpi.border} flex flex-col gap-1 sm:gap-2 transition-all hover:shadow-md duration-300`}>
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
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display text-ink-primary font-semibold">Arrivals Today</h2>
            <Link href="/reservations" className="text-xs font-bold text-accent uppercase tracking-widest hover:underline flex items-center gap-1.5 group">
              View Guest List <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-6 -mx-4 px-4 custom-scrollbar">
            {arrivals.map(booking => {
              const checkIn = parseISO(booking.check_in_date);
              const checkOut = parseISO(booking.check_out_date);
              const nights = differenceInDays(checkOut, checkIn) || 1;
              const room = storedRooms.find(r => r.id === booking.room_id);
              
              return (
                <div key={booking.id} className="min-w-[340px] bg-white border border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col relative group transition-all hover:shadow-md">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent" />
                  <div className="p-5 flex flex-col gap-5">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-bold text-ink-primary tracking-tight leading-tight">{booking.guest_name}</h3>
                        <p className="text-sm font-medium text-ink-secondary">
                          {room ? `Room ${room.room_number}` : 'Double Room'} • {nights} {nights === 1 ? 'night' : 'nights'}
                        </p>
                      </div>
                      <div className="bg-blue-50 text-[10px] font-bold text-blue-600 px-2.5 py-1 rounded-md uppercase tracking-wide border border-blue-100">
                        {booking.booking_source?.replace('_', '.') || 'Booking.com'}
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">ADVANCE PAID</span>
                        <span className="text-2xl font-bold text-ink-primary mt-1 tracking-tight">₹{booking.amount_paid}</span>
                      </div>
                      
                      {booking.status === 'unassigned' ? (
                        <button 
                          onClick={() => openNewBooking()}
                          className="px-6 py-2.5 border-2 border-accent text-accent font-bold rounded-xl text-sm hover:bg-accent/5 transition-all shadow-sm"
                        >
                          Assign Room
                        </button>
                      ) : (
                        <button 
                          onClick={async () => {
                            if (booking.room_id) {
                              await updateBookingStatus(booking.id, 'checked_in');
                              toast(`Guest ${booking.guest_name} checked in!`, 'success');
                              const updatedArrivals = await getArrivalsToday(propertyFilter || undefined);
                              setArrivals(updatedArrivals);
                            }
                          }}
                          className="px-6 py-2.5 border-2 border-success text-success font-bold rounded-xl text-sm hover:bg-success/5 transition-all shadow-sm"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
                  className="btn btn-accent flex items-center gap-2 group whitespace-nowrap"
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
                summary={getPropertySummary(property.id)}
              />
            </div>
          ))}
          {filteredProperties.length === 0 && (
            <div className="col-span-full py-16 bg-bg-sunken/40 rounded-2xl border border-dashed border-border-subtle flex flex-col items-center justify-center text-center">
               <Building2 size={40} strokeWidth={1} className="text-ink-muted/30 mb-3" />
               <h3 className="text-sm font-medium text-ink-primary mb-1">No properties found</h3>
               <p className="text-xs text-ink-muted">Try adjusting your search query</p>
            </div>
          )}
        </div>
        <div className="h-px bg-border-subtle mt-10 mb-6" />
      </section>

      {/* MODAL: Add Property */}
      <Modal 
        isOpen={isAddPropertyOpen} 
        onClose={() => setIsAddPropertyOpen(false)}
        title="Add New Property"
        footer={
          <div className="flex gap-2 w-full">
            <button className="btn btn-secondary flex-1 font-medium" onClick={() => setIsAddPropertyOpen(false)}>Cancel</button>
            <button className="btn btn-accent flex-1 font-medium" onClick={confirmAddProperty}>Add Property</button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-ink-muted uppercase tracking-wider">Property Name*</label>
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
              <label className="text-[10px] font-medium text-ink-muted uppercase tracking-wider">Total Rooms*</label>
              <div className="relative">
                <Bed size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="number" placeholder="20" className="input pl-10" value={newProperty.rooms} onChange={e => setNewProperty({...newProperty, rooms: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-ink-muted uppercase tracking-wider">Address</label>
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
          <button className="btn btn-accent w-full mt-2" onClick={() => setIsUpgradeOpen(false)}>View Plans</button>
        </div>
      </Modal>
    </div>
  );
}
