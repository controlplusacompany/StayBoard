'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '../ui/Modal';
import { getStoredRooms, getBookingsList, getStoredProperties, getSelectedProperty } from '@/lib/store';
import { Room, Booking, Property } from '@/types';
import { Bed, Search, Home, ChevronRight, X, Calendar } from 'lucide-react';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string | null;
}

export default function NewBookingModal({ isOpen, onClose, propertyId }: NewBookingModalProps) {
  const router = useRouter();
  const [stage, setStage] = useState<'CHOICE' | 'ROOM_SELECTION'>('CHOICE');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | 'all'>('all');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [staffPropertyId, setStaffPropertyId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStage('CHOICE');
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('stayboard_user_role');
      const propId = localStorage.getItem('stayboard_user_property');
      setUserRole(role);
      setStaffPropertyId(propId);
      
      if (role === 'reception' && propId) {
        setSelectedPropertyId(propId);
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedRooms, fetchedBookings, fetchedProps] = await Promise.all([
        getStoredRooms(),
        getBookingsList(),
        getStoredProperties()
      ]);
      setRooms(Array.isArray(fetchedRooms) ? fetchedRooms : []);
      setBookings(Array.isArray(fetchedBookings) ? fetchedBookings : []);
      setProperties(fetchedProps as Property[]);
    };
    if (isOpen) {
      fetchData();
      const currentGlobal = getSelectedProperty() || 'all';
      setSelectedPropertyId(propertyId || currentGlobal);
    }
  }, [isOpen, propertyId]);

  const vacantRooms = rooms.filter(r => {
    const isVacant = r.status === 'vacant';
    const matchesProperty = selectedPropertyId === 'all' || r.property_id === selectedPropertyId;
    const matchesSearch = r.room_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!isVacant || !matchesProperty || !matchesSearch) return false;

    // PROPERTY-WIDE INVENTORY PROTECTION
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const propertyRoomsCount = rooms.filter(room => room.property_id === r.property_id).length;
    const activeBookingsCount = bookings.filter(b => {
        if (b.property_id !== r.property_id) return false;
        if (b.status === 'cancelled' || b.status === 'no_show' || b.status === 'checked_out') return false;
        
        const bStartStr = b.check_in_date.split('T')[0];
        const bEndStr = b.check_out_date.split('T')[0];
        return (today < bEndStr && tomorrow > bStartStr);
    }).length;

    return (propertyRoomsCount - activeBookingsCount) > 0;
  });

  const handleRoomSelect = (room: Room) => {
    router.push(`/booking/new?room=${room.room_number}&property=${room.property_id}`);
    onClose();
  };

  const handleContinueWithoutRoom = () => {
    const propId = selectedPropertyId !== 'all' ? selectedPropertyId : (staffPropertyId || '');
    router.push(`/booking/new?property=${propId}&mode=future`);
    onClose();
  };

  if (stage === 'CHOICE') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="New Reservation" size="md">
        <div className="flex flex-col gap-5 py-2">
            <p className="text-sm text-ink-muted leading-relaxed">How would you like to start this reservation?</p>
            
            <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setStage('ROOM_SELECTION')}
                  className="flex items-center gap-4 p-5 bg-white border border-border-subtle rounded-2xl hover:border-accent hover:bg-bg-sunken transition-all group text-left"
                >
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                        <Bed size={24} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-bold text-ink-primary">Select a Vacant Room</span>
                        <span className="text-[11px] text-ink-muted">Ideal for walk-ins or immediate check-ins</span>
                    </div>
                </button>

                <button 
                  onClick={handleContinueWithoutRoom}
                  className="flex items-center gap-4 p-5 bg-white border border-border-subtle rounded-2xl hover:border-accent hover:bg-bg-sunken transition-all group text-left"
                >
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success group-hover:bg-success group-hover:text-white transition-all">
                        <Calendar size={24} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-bold text-ink-primary">Continue without selecting a room</span>
                        <span className="text-[11px] text-ink-muted font-medium">For future reservations with flexible assignment</span>
                    </div>
                </button>
            </div>
            
            <button 
              onClick={onClose}
              className="mt-2 text-xs font-semibold text-ink-muted hover:text-ink-primary self-center"
            >
              Cancel
            </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Select a Vacant Room" 
      size="lg"
      headerActions={
        <button 
          onClick={handleContinueWithoutRoom}
          className="btn btn-accent px-4 py-2 h-auto text-[11px] font-bold shadow-sm uppercase tracking-wider"
        >
          Continue without selecting a room
        </button>
      }
    >
      <div className="flex flex-col gap-6 py-2">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Property Filter - Hidden for Staff or if specific property is selected */}
          {userRole !== 'reception' && (getSelectedProperty() === 'all' || !getSelectedProperty()) && (
            <div className="flex-1">
              <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5 block">Filter Property</label>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setSelectedPropertyId('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedPropertyId === 'all' ? 'bg-accent text-white' : 'bg-bg-sunken text-ink-secondary hover:bg-border-subtle'}`}
                >
                  All
                </button>
                {properties.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedPropertyId(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedPropertyId === p.id ? 'bg-accent text-white' : 'bg-bg-sunken text-ink-secondary hover:bg-border-subtle'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="w-full md:w-48">
            <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5 block">Search Room</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input 
                type="text" 
                className="input pl-9 py-2 text-xs" 
                placeholder="Ex. 101, 202..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {vacantRooms.length > 0 ? (
              vacantRooms.map(room => (
                <button 
                  key={room.id}
                  onClick={() => handleRoomSelect(room)}
                  className="flex flex-col items-center gap-2 p-4 bg-white border border-border-subtle rounded-xl hover:border-accent hover:shadow-md transition-all group text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success group-hover:bg-accent group-hover:text-white transition-colors">
                    <Bed size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-ink-primary">Room {room.room_number}</span>
                    <span className="text-[9px] text-accent font-semibold mt-1">
                      {properties.find(p => p.id === room.property_id)?.name}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center gap-3 text-ink-muted opacity-50">
                <X size={40} strokeWidth={1} />
                <p className="text-sm font-medium">No vacant rooms found</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </Modal>
  );
}
