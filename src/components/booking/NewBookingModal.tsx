'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '../ui/Modal';
import { getStoredRooms } from '@/lib/store';
import { Room } from '@/types';
import { Bed, Search, Home, ChevronRight, X } from 'lucide-react';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string | null;
}

const PROPERTIES = [
  { id: '010', name: 'Peace Hotel' },
  { id: '011', name: 'Starry Nights' },
  { id: '012', name: 'Starry Night Homes' }
];

export default function NewBookingModal({ isOpen, onClose, propertyId }: NewBookingModalProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | 'all'>(propertyId || 'all');

  useEffect(() => {
    setRooms(getStoredRooms([]));
    if (propertyId) setSelectedPropertyId(propertyId);
  }, [isOpen, propertyId]);

  const vacantRooms = rooms.filter(r => {
    const isVacant = r.status === 'vacant';
    const matchesProperty = selectedPropertyId === 'all' || r.property_id === selectedPropertyId;
    const matchesSearch = r.room_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.room_type.toLowerCase().includes(searchQuery.toLowerCase());
    return isVacant && matchesProperty && matchesSearch;
  });

  const handleRoomSelect = (room: Room) => {
    router.push(`/booking/new?room=${room.room_number}&property=${room.property_id}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Vacant Room" size="lg">
      <div className="flex flex-col gap-6 py-2">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Property Filter */}
          <div className="flex-1">
            <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5 block">Filter Property</label>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSelectedPropertyId('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedPropertyId === 'all' ? 'bg-accent text-white' : 'bg-bg-sunken text-ink-secondary hover:bg-border-subtle'}`}
              >
                All
              </button>
              {PROPERTIES.map(p => (
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

          {/* Search */}
          <div className="w-full md:w-48">
            <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5 block">Search Room</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input 
                type="text" 
                className="input pl-9 py-2 text-xs" 
                placeholder="Ex. 101, Deluxe..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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
                    <span className="text-[10px] text-ink-muted uppercase tracking-tight">{room.room_type}</span>
                    <span className="text-[9px] text-accent font-semibold mt-1">
                      {PROPERTIES.find(p => p.id === room.property_id)?.name}
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
