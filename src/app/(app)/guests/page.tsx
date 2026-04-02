'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  Star, 
  ArrowRight,
  UserCircle2,
  Phone,
  CreditCard,
  Calendar
} from 'lucide-react';
import { getStoredGuests } from '@/lib/store';
import { Guest } from '@/types';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVip, setFilterVip] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  useEffect(() => {
    const rawGuests = getStoredGuests();
    // Sort by recent stays
    setGuests(Object.values(rawGuests).sort((a, b) => {
      const dateA = a.last_stay_date ? new Date(a.last_stay_date).getTime() : 0;
      const dateB = b.last_stay_date ? new Date(b.last_stay_date).getTime() : 0;
      return dateB - dateA;
    }));
  }, []);

  const filteredGuests = guests.filter(g => {
    const matchesSearch = 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.phone.includes(searchQuery) ||
      g.id_number.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesVip = filterVip ? g.is_vip : true;
    
    return matchesSearch && matchesVip;
  });

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 animate-slide-up bg-bg-canvas min-h-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display text-ink-primary tracking-tight font-extrabold">Guest Directory</h1>
          <p className="text-ink-secondary">Manage relationships and viewing loyal customers.</p>
        </div>
        
        {/* Metric Summaries */}
        <div className="flex flex-wrap gap-4">
          <div className="bg-white border border-border-subtle rounded-xl p-4 flex flex-col gap-1 shadow-sm min-w-[120px]">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Total Guests</span>
            <span className="text-2xl font-mono font-bold text-ink-primary">{guests.length}</span>
          </div>
          <div className="bg-white border text-accent border-accent/20 rounded-xl p-4 flex flex-col gap-1 shadow-sm min-w-[120px]">
            <span className="text-xs font-bold uppercase tracking-wider">VIP Guests</span>
            <span className="text-2xl font-mono font-bold flex items-center gap-2">
              {guests.filter(g => g.is_vip).length}
              <Star size={16} fill="currentColor" />
            </span>
          </div>
        </div>
      </header>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-border-subtle shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input 
              type="text" 
              className="input pl-10" 
              placeholder={searchQuery ? "" : "Search name, phone, or ID..."} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className={`btn border shadow-none font-bold ${filterVip ? 'border-accent text-accent bg-accent/5' : 'border-border-strong text-ink-secondary hover:bg-bg-sunken hover:text-ink-primary'}`}
            onClick={() => setFilterVip(!filterVip)}
          >
            <Star size={16} className={filterVip ? 'fill-current' : ''} />
            VIP Only
          </button>
        </div>
      </div>

      {/* Guest List Grid */}
      {filteredGuests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGuests.map(guest => (
            <div 
              key={guest.id}
              onClick={() => setSelectedGuest(guest)}
              className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col gap-4 relative overflow-hidden"
            >
              {guest.is_vip && (
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                  <div className="absolute top-2 -right-6 bg-accent text-white text-[10px] font-bold py-1 px-8 rotate-45 shadow-sm">
                    VIP
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-bg-sunken rounded-full flex items-center justify-center text-ink-muted group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                  <UserCircle2 size={24} />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-display font-bold text-ink-primary text-xl leading-tight truncate pr-8">
                    {guest.name}
                  </h3>
                  <span className="text-xs text-ink-muted font-mono">{guest.phone}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end border-t border-border-subtle pt-4 mt-auto">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wide">Lifetime Value</span>
                  <span className="font-mono font-bold text-ink-primary">₹{guest.total_spent.toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wide">Total Stays</span>
                  <span className="font-mono font-bold text-ink-primary">{guest.total_stays}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-border-subtle rounded-xl border-dashed">
           <Users size={48} className="text-border-strong mb-4" />
           <h3 className="text-lg font-bold text-ink-primary mb-1">No guests found</h3>
           <p className="text-ink-secondary text-sm">We couldn't find any guests matching your criteria.</p>
        </div>
      )}

      {/* Guest Detail Modal */}
      <Modal
        isOpen={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
        title="Guest Profile"
      >
        {selectedGuest && (
          <div className="flex flex-col gap-6">
            {/* Header Block */}
            <div className={`p-4 rounded-xl flex items-center gap-4 ${selectedGuest.is_vip ? 'bg-accent text-white' : 'bg-bg-sunken text-ink-primary'}`}>
               <div className={`w-14 h-14 rounded-full flex items-center justify-center ${selectedGuest.is_vip ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                  <UserCircle2 size={28} className={selectedGuest.is_vip ? 'text-white' : 'text-ink-muted'} />
               </div>
               <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-display font-medium leading-none">{selectedGuest.name}</h2>
                    {selectedGuest.is_vip && <Star size={16} className="fill-current text-white" />}
                  </div>
                  <span className={`text-sm mt-1 font-mono ${selectedGuest.is_vip ? 'text-white/80' : 'text-ink-secondary'}`}>
                    ID: {selectedGuest.id_type.toUpperCase()} • {selectedGuest.id_number}
                  </span>
               </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border border-border-subtle rounded-lg p-3 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted flex items-center gap-1.5">
                  <Phone size={12} /> Contact
                </span>
                <span className="font-mono text-sm font-bold text-ink-primary">{selectedGuest.phone}</span>
              </div>
              <div className="border border-border-subtle rounded-lg p-3 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted flex items-center gap-1.5">
                  <CreditCard size={12} /> Total Spent
                </span>
                <span className="font-mono text-sm font-bold text-success">₹{selectedGuest.total_spent.toLocaleString()}</span>
              </div>
              <div className="border border-border-subtle rounded-lg p-3 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted flex items-center gap-1.5">
                  <Calendar size={12} /> Total Stays
                </span>
                <span className="font-mono text-sm font-bold text-ink-primary">{selectedGuest.total_stays}</span>
              </div>
              <div className="border border-border-subtle rounded-lg p-3 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted flex items-center gap-1.5">
                  <ArrowRight size={12} /> Last Visit
                </span>
                <span className="text-sm font-bold text-ink-primary">
                  {selectedGuest.last_stay_date ? format(new Date(selectedGuest.last_stay_date), 'dd MMM yyyy') : 'Never'}
                </span>
              </div>
            </div>

            {/* VIP Toggler (just visual for now) */}
            <div className="bg-white border border-border-subtle p-4 rounded-xl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-ink-primary text-sm line-clamp-1">VIP Status</span>
                <span className="text-xs text-ink-muted">Highlight this guest for special treatment.</span>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer flex items-center ${selectedGuest.is_vip ? 'bg-accent justify-end' : 'bg-border-strong justify-start'}`}>
                <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Internal Notes</label>
              <textarea 
                className="input min-h-[100px] resize-none" 
                placeholder={selectedGuest.notes ? "" : "Add dietary preferences, room preferences, or anything else about this guest..."}
                defaultValue={selectedGuest.notes}
                readOnly
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
