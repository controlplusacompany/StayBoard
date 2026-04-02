'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  IndianRupee,
  Users,
  Building
} from 'lucide-react';
import { getStoredBookings, getStoredInvoices, getStoredRooms } from '@/lib/store';
import { Booking, Invoice, Room } from '@/types';
import { format, subDays, isWithinInterval, isSameDay, parseISO } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30days');
  
  // Derived state
  const [revenue, setRevenue] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [occupancy, setOccupancy] = useState(0);
  const [adr, setAdr] = useState(0); // Average Daily Rate

  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);

  useEffect(() => {
    // Basic computation for MVP showcase
    const allBookings = Object.values(getStoredBookings({}));
    const allInvoices = Object.values(getStoredInvoices());
    const allRooms = getStoredRooms([]);
    
    // In a real app we'd filter these by dateRange
    // For MVP, we'll just sum everything but pretend it's filtered
    const totalRev = allInvoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
    const completedOrActiveBookings = allBookings.filter(b => b.status !== 'cancelled' && b.status !== 'no_show');
    
    // Filter bookings for the list
    let list = allBookings;
    const now = new Date();
    
    if (filter === 'arrivals') {
      list = allBookings.filter(b => isSameDay(parseISO(b.check_in_date), now));
    } else if (filter === 'check_out') {
      list = allBookings.filter(b => isSameDay(parseISO(b.check_out_date), now));
    } else if (filter === 'occupied') {
      list = allBookings.filter(b => b.status === 'checked_in');
    }

    setFilteredBookings(list);

    // Mocking an occupancy rate (Total booked nights / Total available nights)
    const mockOccupancy = Math.min((completedOrActiveBookings.length * 5) + 32, 100); 
    const calculatedAdr = completedOrActiveBookings.length > 0 
      ? totalRev / completedOrActiveBookings.length 
      : 2450;

    setRevenue(totalRev > 0 ? totalRev : 142500); // Mock starting revenue if empty
    setBookingsCount(completedOrActiveBookings.length > 0 ? completedOrActiveBookings.length : 43); // Mock
    setOccupancy(mockOccupancy);
    setAdr(calculatedAdr);
    
  }, [dateRange, filter]);

  const handleExportCSV = () => {
    // In a real app, this generates a CSV string and downloads it
    alert("Exporting report as CSV...");
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 animate-slide-up bg-bg-canvas min-h-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display text-ink-primary tracking-tight font-extrabold">Performance Reports</h1>
          <p className="text-base text-ink-secondary">Analyze revenue, occupancy, and business metrics.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select 
            options={[
              { id: '7days', label: 'Last 7 Days', icon: Calendar, description: 'Past week' },
              { id: '30days', label: 'Last 30 Days', icon: Calendar, description: 'Past month' },
              { id: 'this_month', label: 'This Month', icon: Calendar, description: 'Current month' },
              { id: 'last_month', label: 'Last Month', icon: Calendar, description: 'Previous month' },
              { id: 'ytd', label: 'Year to Date', icon: Calendar, description: 'Full year' }
            ]}
            value={dateRange}
            onChange={setDateRange}
            className="sm:w-56"
          />
          <button 
            onClick={handleExportCSV}
            className="btn bg-white border border-border-strong text-ink-primary shadow-sm hover:bg-bg-sunken flex items-center justify-center gap-2 font-bold h-11 px-6"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-white border text-accent border-accent/20 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-3 sm:gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/5 rounded-full pointer-events-none"></div>
          <div className="flex justify-between items-start shrink-0">
             <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-accent/10 flex items-center justify-center">
               <IndianRupee size={18} className="text-accent" />
             </div>
             <span className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-success">
               <TrendingUp size={12} /> +12.5%
             </span>
          </div>
          <div className="flex flex-col gap-0.5">
             <h3 className="text-[10px] uppercase font-bold tracking-wider text-ink-muted">Total Revenue</h3>
             <span className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-ink-primary">₹{revenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Occupancy */}
        <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-bg-sunken flex items-center justify-center">
               <Building size={20} className="text-ink-secondary" />
             </div>
             <span className="flex items-center gap-1 text-sm font-bold text-success">
               <TrendingUp size={14} /> +4.2%
             </span>
          </div>
          <div className="flex flex-col gap-1">
             <h3 className="text-xs uppercase font-bold tracking-wider text-ink-muted">Occupancy Rate</h3>
             <span className="text-3xl font-mono font-bold text-ink-primary">{occupancy.toFixed(1)}%</span>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-bg-sunken flex items-center justify-center">
               <Calendar size={20} className="text-ink-secondary" />
             </div>
          </div>
          <div className="flex flex-col gap-1">
             <h3 className="text-xs uppercase font-bold tracking-wider text-ink-muted">Total Bookings</h3>
             <span className="text-3xl font-mono font-bold text-ink-primary">{bookingsCount}</span>
          </div>
        </div>

        {/* ADR */}
        <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-bg-sunken flex items-center justify-center">
               <BarChart3 size={20} className="text-ink-secondary" />
             </div>
          </div>
          <div className="flex flex-col gap-1">
             <h3 className="text-xs uppercase font-bold tracking-wider text-ink-muted">Average Daily Rate (ADR)</h3>
             <span className="text-3xl font-mono font-bold text-ink-primary">₹{Math.round(adr).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Mock Visual Charts area using flex grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Revenue Bar Chart (CSS Mock) */}
         <div className="lg:col-span-2 bg-white border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <h3 className="font-bold text-ink-primary text-lg">Revenue vs Last Period</h3>
            <div className="h-64 flex items-end justify-between gap-1 mt-auto border-b border-border-strong pb-4 relative overflow-x-auto no-scrollbar">
               {/* Y-axis labels mock */}
               <div className="absolute left-0 top-0 bottom-4 w-12 flex flex-col justify-between text-xs text-ink-muted font-mono border-r border-border-subtle">
                  <span>₹200k</span>
                  <span>₹100k</span>
                  <span>₹0</span>
               </div>
               
               {/* Mock Bars */}
               <div className="w-12 ml-14 flex items-end gap-1 h-full pt-4">
                  <div className="w-1/2 bg-bg-sunken h-[40%] rounded-t-sm"></div>
                  <div className="w-1/2 bg-accent h-[45%] rounded-t-sm"></div>
               </div>
               <div className="w-12 flex items-end gap-1 h-full pt-4">
                  <div className="w-1/2 bg-bg-sunken h-[55%] rounded-t-sm"></div>
                  <div className="w-1/2 bg-accent h-[60%] rounded-t-sm"></div>
               </div>
               <div className="w-12 flex items-end gap-1 h-full pt-4">
                  <div className="w-1/2 bg-bg-sunken h-[50%] rounded-t-sm"></div>
                  <div className="w-1/2 bg-accent h-[65%] rounded-t-sm"></div>
               </div>
               <div className="w-12 flex items-end gap-1 h-full pt-4">
                  <div className="w-1/2 bg-bg-sunken h-[70%] rounded-t-sm"></div>
                  <div className="w-1/2 bg-accent h-[80%] rounded-t-sm"></div>
               </div>
               <div className="w-12 flex items-end gap-1 h-full pt-4">
                  <div className="w-1/2 bg-bg-sunken h-[40%] rounded-t-sm"></div>
                  <div className="w-1/2 bg-accent h-[50%] rounded-t-sm"></div>
               </div>
               <div className="w-12 flex items-end gap-1 h-full pt-4">
                  <div className="w-1/2 bg-bg-sunken h-[85%] rounded-t-sm"></div>
                  <div className="w-1/2 bg-accent h-[95%] rounded-t-sm"></div>
               </div>
            </div>
            {/* X-axis labels */}
            <div className="flex justify-between pl-14 text-xs font-bold text-ink-muted">
               <span>Mon</span>
               <span>Tue</span>
               <span>Wed</span>
               <span>Thu</span>
               <span>Fri</span>
               <span>Sat</span>
            </div>
         </div>

         {/* Channel Mix Pie Chart (CSS Mock) */}
         <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <h3 className="font-bold text-ink-primary text-lg">Booking Channels</h3>
            <div className="flex-1 flex flex-col items-center justify-center gap-8">
               {/* Fake Pie Chart using conic gradient */}
               <div className="w-40 h-40 rounded-full shadow-sm" style={{ background: 'conic-gradient(#2563EB 0% 55%, #1D4ED8 55% 80%, #94A3B8 80% 95%, #CBD5E1 95% 100%)' }}></div>
               
               <div className="flex flex-col gap-3 w-full">
                  <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center gap-2 font-bold text-ink-primary">
                        <div className="w-3 h-3 rounded-full bg-[#2563EB]"></div> Direct
                     </div>
                     <span className="font-mono text-ink-muted">55%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center gap-2 font-bold text-ink-primary">
                        <div className="w-3 h-3 rounded-full bg-[#1D4ED8]"></div> Booking.com
                     </div>
                     <span className="font-mono text-ink-muted">25%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center gap-2 font-bold text-ink-primary">
                        <div className="w-3 h-3 rounded-full bg-[#94A3B8]"></div> MakeMyTrip
                     </div>
                     <span className="font-mono text-ink-muted">15%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center gap-2 font-bold text-ink-primary">
                        <div className="w-3 h-3 rounded-full bg-[#CBD5E1]"></div> Other
                     </div>
                     <span className="font-mono text-ink-muted">5%</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Booking List Table */}
      <section className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink-primary font-display capitalize">{filter ? filter.replace('_', ' ') : 'Recent'} Bookings</h2>
        </div>
        
        <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-sunken border-b border-border-subtle">
                <th className="px-6 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Guest</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Stay Duration</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredBookings.length > 0 ? filteredBookings.map(b => (
                <tr key={b.id} className="hover:bg-bg-sunken/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-ink-primary">{b.guest_name}</span>
                      <span className="text-xs text-ink-muted font-mono">{b.guest_phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-sm">
                      <span className="text-ink-secondary">{format(parseISO(b.check_in_date), 'dd MMM')} - {format(parseISO(b.check_out_date), 'dd MMM')}</span>
                      <span className="text-[10px] font-bold text-accent uppercase tracking-tighter">Room {b.room_id.split('-').pop()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-ink-primary">
                    ₹{b.total_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[10px] font-bold text-accent uppercase tracking-widest hover:underline">View Details</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-ink-muted italic">No bookings found for this filter</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
