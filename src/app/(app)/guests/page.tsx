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
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  MoreVertical,
  X,
  FileSpreadsheet
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
  const [sortConfig, setSortConfig] = useState<{ key: keyof Guest | 'last_stay_date'; direction: 'asc' | 'desc' } | null>({ key: 'last_stay_date', direction: 'desc' });
  const [columnFilters, setColumnFilters] = useState<Partial<Record<keyof Guest, string>>>({});
  const [showColumnFilters, setShowColumnFilters] = useState(false);

  useEffect(() => {
    const rawGuests = getStoredGuests();
    setGuests(Object.values(rawGuests));
  }, []);

  const handleToggleVip = (guestId: string) => {
    const updatedGuests = guests.map(g => {
      if (g.id === guestId) {
        const updated = { ...g, is_vip: !g.is_vip };
        // Sync with selectedGuest if open
        if (selectedGuest?.id === guestId) setSelectedGuest(updated);
        return updated;
      }
      return g;
    });
    
    setGuests(updatedGuests);
    
    // Persist to localStorage
    const stored = JSON.parse(localStorage.getItem('stayboard_guests') || '{}');
    if (stored[guestId]) {
      stored[guestId].is_vip = !stored[guestId].is_vip;
      localStorage.setItem('stayboard_guests', JSON.stringify(stored));
    }
  };

  const handleSort = (key: keyof Guest | 'last_stay_date') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredGuests = guests.filter(g => {
    // Global Search
    const matchesGlobal = 
      !searchQuery ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.phone.includes(searchQuery) ||
      g.id_number.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Column Filters
    const matchesColumn = Object.entries(columnFilters).every(([key, value]) => {
      if (!value) return true;
      const guestValue = g[key as keyof Guest];
      return guestValue?.toString().toLowerCase().includes(value.toLowerCase());
    });

    const matchesVip = filterVip ? g.is_vip : true;
    
    return matchesGlobal && matchesColumn && matchesVip;
  });

  const handleExportCSV = () => {
    if (sortedGuests.length === 0) return;
    
    const headers = ['Name', 'Phone', 'ID Number', 'ID Type', 'Total Spent', 'Stays', 'Last Visit', 'VIP'];
    const rows = sortedGuests.map(g => [
      g.name,
      g.phone,
      g.id_number,
      g.id_type,
      g.total_spent,
      g.total_stays,
      g.last_stay_date ? format(new Date(g.last_stay_date), 'yyyy-MM-dd HH:mm') : 'Never',
      g.is_vip ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `StayBoard_Guests_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedGuests = [...filteredGuests].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aValue: any = a[key as keyof Guest];
    let bValue: any = b[key as keyof Guest];

    // Handle dates
    if (key === 'last_stay_date' || key === 'created_at') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ column }: { column: keyof Guest | 'last_stay_date' }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-accent" /> : <ArrowDown size={12} className="text-accent" />;
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 animate-slide-up bg-bg-canvas min-h-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display text-ink-primary tracking-tight">Guest Directory</h1>
          <p className="text-ink-secondary">Manage relationships and viewing loyal customers.</p>
        </div>
        
        {/* Metric Summaries */}
        <div className="flex flex-wrap gap-4">
          <div className="bg-white border border-border-subtle rounded-xl p-4 flex flex-col gap-1 shadow-sm min-w-[120px]">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Total Guests</span>
            <span className="text-2xl font-mono font-semibold text-ink-primary">{guests.length}</span>
          </div>
          <div className="bg-white border text-accent border-accent/20 rounded-xl p-4 flex flex-col gap-1 shadow-sm min-w-[120px]">
            <span className="text-xs font-semibold uppercase tracking-wider">VIP Guests</span>
            <span className="text-2xl font-mono font-semibold flex items-center gap-2">
              {guests.filter(g => g.is_vip).length}
              <Star size={16} fill="currentColor" />
            </span>
          </div>
        </div>
      </header>

      {/* Filters & Actions */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-border-subtle shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input 
                type="text" 
                className="input pl-12" 
                placeholder={searchQuery ? "" : "Search guest..."} 
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
            <button 
              className={`btn border shadow-none font-semibold ${showColumnFilters ? 'border-accent text-accent bg-accent/5' : 'border-border-strong text-ink-secondary hover:bg-bg-sunken hover:text-ink-primary'}`}
              onClick={() => setShowColumnFilters(!showColumnFilters)}
            >
              <Filter size={16} />
              {showColumnFilters ? 'Hide Filters' : 'Column Filters'}
            </button>
            <button 
              onClick={handleExportCSV}
              className="btn border border-border-strong text-ink-secondary hover:bg-bg-sunken hover:text-ink-primary shadow-none font-semibold"
            >
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
          </div>
          
          {Object.keys(columnFilters).length > 0 && (
            <button 
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              onClick={() => setColumnFilters({})}
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Guest List Table */}
      <div className="bg-white border border-border-subtle rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-sunken/50">
                <th 
                  className="py-4 px-6 text-xs font-semibold text-ink-muted uppercase tracking-wider cursor-pointer hover:text-accent transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2 text-nowrap">
                    Guest Name <SortIcon column="name" />
                  </div>
                </th>
                <th 
                  className="py-4 px-6 text-xs font-semibold text-ink-muted uppercase tracking-wider cursor-pointer hover:text-accent transition-colors"
                  onClick={() => handleSort('phone')}
                >
                  <div className="flex items-center gap-2 text-nowrap">
                    Phone <SortIcon column="phone" />
                  </div>
                </th>
                <th 
                  className="py-4 px-6 text-xs font-semibold text-ink-muted uppercase tracking-wider cursor-pointer hover:text-accent transition-colors"
                  onClick={() => handleSort('id_number')}
                >
                  <div className="flex items-center gap-2 text-nowrap">
                    ID Info <SortIcon column="id_number" />
                  </div>
                </th>
                <th 
                  className="py-4 px-6 text-xs font-semibold text-ink-muted uppercase tracking-wider cursor-pointer hover:text-accent transition-colors"
                  onClick={() => handleSort('total_spent')}
                >
                  <div className="flex items-center gap-2 text-nowrap">
                    Value <SortIcon column="total_spent" />
                  </div>
                </th>
                <th 
                  className="py-4 px-6 text-xs font-semibold text-ink-muted uppercase tracking-wider cursor-pointer hover:text-accent transition-colors"
                  onClick={() => handleSort('total_stays')}
                >
                  <div className="flex items-center gap-2 text-nowrap text-center">
                    Stays <SortIcon column="total_stays" />
                  </div>
                </th>
                <th 
                  className="py-4 px-6 text-xs font-semibold text-ink-muted uppercase tracking-wider cursor-pointer hover:text-accent transition-colors text-right"
                  onClick={() => handleSort('last_stay_date')}
                >
                  <div className="flex items-center gap-2 justify-end text-nowrap">
                    Last Visit <SortIcon column="last_stay_date" />
                  </div>
                </th>
              </tr>
              
              {showColumnFilters && (
                <tr className="bg-bg-canvas border-b border-border-subtle">
                  <th className="p-2 px-6">
                    <input 
                      type="text" 
                      className="input py-1 text-xs" 
                      placeholder="Filter name..." 
                      value={columnFilters.name || ''}
                      onChange={e => setColumnFilters({...columnFilters, name: e.target.value})}
                    />
                  </th>
                  <th className="p-2 px-6">
                    <input 
                      type="text" 
                      className="input py-1 text-xs" 
                      placeholder="Filter phone..."
                      value={columnFilters.phone || ''}
                      onChange={e => setColumnFilters({...columnFilters, phone: e.target.value})}
                    />
                  </th>
                  <th className="p-2 px-6">
                    <input 
                      type="text" 
                      className="input py-1 text-xs" 
                      placeholder="Filter ID..."
                      value={columnFilters.id_number || ''}
                      onChange={e => setColumnFilters({...columnFilters, id_number: e.target.value})}
                    />
                  </th>
                  <th className="p-2 px-6">
                    <input 
                      type="text" 
                      className="input py-1 text-xs" 
                      placeholder="Filter value..."
                      value={columnFilters.total_spent || ''}
                      onChange={e => setColumnFilters({...columnFilters, total_spent: e.target.value})}
                    />
                  </th>
                  <th className="p-2 px-6">
                    <input 
                      type="text" 
                      className="input py-1 text-xs text-center" 
                      placeholder="Filter stays..."
                      value={columnFilters.total_stays || ''}
                      onChange={e => setColumnFilters({...columnFilters, total_stays: e.target.value})}
                    />
                  </th>
                  <th className="p-2 px-6">
                  </th>
                </tr>
              )}
            </thead>
            <tbody>
              {sortedGuests.map((guest) => (
                <tr 
                  key={guest.id} 
                  className="border-b border-border-subtle/50 hover:bg-bg-sunken/30 transition-colors group cursor-pointer"
                  onClick={() => setSelectedGuest(guest)}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${guest.is_vip ? 'bg-accent/10 text-accent' : 'bg-bg-sunken text-ink-muted'}`}>
                        <UserCircle2 size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-ink-primary flex items-center gap-1.5">
                          {guest.name}
                          {guest.is_vip && <Star size={12} className="fill-accent text-accent" />}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-ink-muted tracking-wider">
                          {guest.is_vip ? 'VIP Guest' : 'Standard'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-sm text-ink-secondary">
                    {guest.phone}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-ink-primary">{guest.id_number}</span>
                      <span className="text-[10px] uppercase font-semibold text-ink-muted">{guest.id_type}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono font-semibold text-success">
                    ₹{guest.total_spent.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Badge type="info" label={guest.total_stays.toString()} className="font-mono" />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-semibold text-ink-primary">
                        {guest.last_stay_date ? format(new Date(guest.last_stay_date), 'dd MMM yyyy') : 'Never'}
                      </span>
                      <span className="text-[10px] font-mono text-ink-muted">
                        {guest.last_stay_date ? format(new Date(guest.last_stay_date), 'HH:mm') : '--:--'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              
              {sortedGuests.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-ink-muted">
                      <Users size={48} className="opacity-20" />
                      <p className="font-bold">No guests found</p>
                      <p className="text-sm">Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <span className="text-[10px] uppercase font-semibold tracking-wider text-ink-muted flex items-center gap-1.5">
                  <Phone size={12} /> Contact
                </span>
                <span className="font-mono text-sm font-semibold text-ink-primary">{selectedGuest.phone}</span>
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

            {/* VIP Toggler */}
            <div className="bg-white border border-border-subtle p-4 rounded-xl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-ink-primary text-sm line-clamp-1">VIP Status</span>
                <span className="text-xs text-ink-muted">Highlight this guest for special treatment.</span>
              </div>
              <div 
                className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer flex items-center ${selectedGuest.is_vip ? 'bg-accent justify-end' : 'bg-border-strong justify-start'}`}
                onClick={() => handleToggleVip(selectedGuest.id)}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Internal Notes</label>
              <textarea 
                className="input min-h-[100px] resize-none" 
                placeholder={selectedGuest?.notes ? "" : "Add dietary preferences, room preferences, or anything else about this guest..."}
                defaultValue={selectedGuest?.notes}
                readOnly
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
