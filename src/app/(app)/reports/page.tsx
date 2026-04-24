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
import { getBookingsList, getStoredInvoices, getStoredRooms, getSelectedProperty } from '@/lib/store';
import { Booking, Invoice, Room } from '@/types';
import { format, subDays, isWithinInterval, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { calculateIndustrialMetrics, getRevenueForecast, RevenueMetrics } from '@/lib/analytics';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { UserCircle2, ArrowRight, CreditCard, Clock, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportsPage({ isHub = false }: { isHub?: boolean }) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('30days');
  const [adr, setAdr] = useState(0); 
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    // 1. ROLE GUARD: Staff cannot see reports
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('stayboard_user_role');
      if (role === 'reception' || role === 'staff') {
        router.push('/dashboard');
        return;
      }
    }

    const fetchData = async () => {
      const currentProperty = getSelectedProperty();
      const [bookingsRaw, invoicesRaw, roomsRaw] = await Promise.all([
        getBookingsList(),
        getStoredInvoices(),
        getStoredRooms()
      ]);

      let allBookings = (bookingsRaw || []) as Booking[];
      let allInvoices = (invoicesRaw || []) as Invoice[];
      let allRooms = (roomsRaw || []) as Room[];

      if (currentProperty && currentProperty !== 'all') {
        allBookings = allBookings.filter(b => b.property_id === currentProperty);
        allInvoices = allInvoices.filter(i => {
           const booking = allBookings.find(b => b.id === i.booking_id);
           return booking?.property_id === currentProperty;
        });
        allRooms = allRooms.filter(r => r.property_id === currentProperty);
      }
      
      setRooms(allRooms);
      
      const now = new Date();
      let start = subDays(now, 30);
      let end = now;

      if (dateRange === '7days') start = subDays(now, 7);
      else if (dateRange === 'this_month') start = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (dateRange === 'ytd') start = new Date(now.getFullYear(), 0, 1);
      else if (dateRange === 'custom') {
        start = startOfDay(parseISO(customStart));
        end = endOfDay(parseISO(customEnd));
      }

      const indMetrics = calculateIndustrialMetrics(allBookings, allRooms, allInvoices, start, end);
      setMetrics(indMetrics);
      setForecast(getRevenueForecast(allBookings, allRooms.length || 10));

      // Filter list for display
      let list = [...allBookings];
      if (filter === 'arrivals') list = allBookings.filter(b => isSameDay(parseISO(b.check_in_date), now));
      else if (filter === 'check_out') list = allBookings.filter(b => isSameDay(parseISO(b.check_out_date), now));
      else if (filter === 'occupied') list = allBookings.filter(b => b.status === 'checked_in');

      setFilteredBookings(list);
    };

    fetchData();
    window.addEventListener('storage', fetchData);
    window.addEventListener('stayboard_update', fetchData);
    return () => {
      window.removeEventListener('storage', fetchData);
      window.removeEventListener('stayboard_update', fetchData);
    };
  }, [dateRange, filter, customStart, customEnd]);

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Guest Name", "Phone", "Check In", "Check Out", "Amount", "Status"];
    const rows = filteredBookings.map(b => [
      b.guest_name,
      b.guest_phone,
      b.check_in_date,
      b.check_out_date,
      b.total_amount,
      b.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stayboard_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={isHub ? "p-0 flex flex-col gap-8 animate-slide-up" : "p-6 md:p-10 flex flex-col gap-8 animate-slide-up bg-bg-canvas min-h-full"}>
      {!isHub && (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-medium text-accent uppercase tracking-[0.3em] font-sans">Business Intelligence</span>
            <h1 className="text-4xl md:text-5xl font-display text-ink-primary tracking-tighter font-medium text-balance">Performance Reports</h1>
          </div>
        </header>
      )}

      {/* Action Bar: Filters & Export */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-border-subtle shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select 
            options={[
              { id: '7days', label: 'Last 7 Days', icon: Calendar, description: 'Past week' },
              { id: '30days', label: 'Last 30 Days', icon: Calendar, description: 'Past month' },
              { id: 'this_month', label: 'This Month', icon: Calendar, description: 'Current month' },
              { id: 'last_month', label: 'Last Month', icon: Calendar, description: 'Previous month' },
              { id: 'ytd', label: 'Year to Date', icon: Calendar, description: 'Full year' },
              { id: 'custom', label: 'Custom Range', icon: Clock, description: 'Select exact dates' }
            ]}
            value={dateRange}
            onChange={(val) => {
              setDateRange(val);
              if (val === 'custom') setShowCustomModal(true);
            }}
            className="sm:w-56"
          />
          <button 
            onClick={handleExportCSV}
            className="btn bg-white border border-border-strong text-ink-primary shadow-sm hover:bg-bg-sunken flex items-center justify-center gap-2 font-semibold h-11 px-6"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-white border text-accent border-accent/20 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-3 sm:gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/5 rounded-full pointer-events-none"></div>
          <div className="flex justify-between items-start shrink-0">
             <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-accent/10 flex items-center justify-center">
               <IndianRupee size={18} className="text-accent" />
             </div>
             <span className={`flex items-center gap-1 text-[11px] sm:text-xs font-medium ${(metrics?.comparison.revenueGrowth || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
               <TrendingUp size={12} className={(metrics?.comparison.revenueGrowth || 0) < 0 ? 'rotate-180' : ''} /> 
               {Math.abs(Math.round(metrics?.comparison.revenueGrowth || 0))}%
             </span>
          </div>
          <div className="flex flex-col gap-0.5">
             <h3 className="text-[10px] uppercase font-semibold tracking-wider text-ink-muted">Total Revenue</h3>
             <span className="text-xl sm:text-2xl md:text-3xl font-mono font-semibold text-ink-primary">₹{(metrics?.totalRevenue || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Occupancy */}
        <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-bg-sunken flex items-center justify-center">
               <Building size={20} className="text-ink-secondary" />
             </div>
             <span className={`flex items-center gap-1 text-sm font-medium ${(metrics?.comparison.occupancyGrowth || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
               <TrendingUp size={14} className={(metrics?.comparison.occupancyGrowth || 0) < 0 ? 'rotate-180' : ''} /> 
               {Math.abs(Math.round(metrics?.comparison.occupancyGrowth || 0))}%
             </span>
          </div>
          <div className="flex flex-col gap-1">
             <h3 className="text-xs uppercase font-semibold tracking-wider text-ink-muted">Occupancy Rate</h3>
             <span className="text-3xl font-mono font-semibold text-ink-primary">{(metrics?.occupancy || 0).toFixed(1)}%</span>
          </div>
        </div>

        {/* ADR */}
        <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-bg-sunken flex items-center justify-center">
               <Clock size={20} className="text-ink-secondary" />
             </div>
          </div>
          <div className="flex flex-col gap-1">
             <h3 className="text-xs uppercase font-semibold tracking-wider text-ink-muted">Avg Daily Rate (ADR)</h3>
             <span className="text-3xl font-mono font-semibold text-ink-primary">₹{Math.round(metrics?.adr || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* RevPAR */}
        <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <div className="w-10 h-10 rounded-full bg-bg-sunken flex items-center justify-center">
               <BarChart3 size={20} className="text-ink-secondary" />
             </div>
          </div>
          <div className="flex flex-col gap-1">
             <h3 className="text-xs uppercase font-medium tracking-wider text-ink-muted">RevPAR</h3>
             <span className="text-3xl font-mono font-medium text-ink-primary">₹{Math.round(metrics?.revpar || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Mock Visual Charts area using flex grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Revenue Bar Chart (Forecasting) */}
         <div className="lg:col-span-2 bg-white border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <h3 className="font-semibold text-ink-primary text-lg">7-Day Revenue Forecast</h3>
               <Badge label="Predictive" type="checked_in" />
            </div>
            <div className="h-64 flex items-end justify-between gap-1 mt-auto border-b border-border-strong pb-4 relative overflow-x-auto no-scrollbar pt-8">
               {/* Y-axis labels mock */}
               <div className="absolute left-0 top-0 bottom-4 w-12 flex flex-col justify-between text-[10px] text-ink-muted font-mono border-r border-border-subtle">
                  <span>₹25k</span>
                  <span>₹12k</span>
                  <span>₹0</span>
               </div>
               
               {/* Bar for each day in forecast */}
               {forecast.map((day, i) => (
                 <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div 
                      className="w-8 bg-accent/20 rounded-t-sm group-hover:bg-accent transition-all duration-300 relative" 
                      style={{ height: `${Math.min((day.revenue / 25000) * 100, 100)}%` }}
                    >
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                          ₹{Math.round(day.revenue).toLocaleString()}
                       </div>
                    </div>
                    <span className="text-[10px] font-medium text-ink-muted mt-4">{day.date}</span>
                 </div>
               ))}
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
                     <div className="flex items-center gap-2 font-medium text-ink-primary">
                        <div className="w-3 h-3 rounded-full bg-[#2563EB]"></div> Direct
                     </div>
                     <span className="font-mono text-ink-muted">55%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center gap-2 font-medium text-ink-primary">
                        <div className="w-3 h-3 rounded-full bg-[#1D4ED8]"></div> Booking.com
                     </div>
                     <span className="font-mono text-ink-muted">25%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center gap-2 font-medium text-ink-primary">
                        <div className="w-3 h-3 rounded-full bg-[#94A3B8]"></div> MakeMyTrip
                     </div>
                     <span className="font-mono text-ink-muted">15%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center gap-2 font-medium text-ink-primary">
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
          <h2 className="text-xl font-semibold text-ink-primary font-display capitalize tracking-tight">{filter ? filter.replace('_', ' ') : 'Recent'} Bookings</h2>
        </div>
        
        <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-sunken border-b border-border-subtle">
                <th className="px-6 py-4 text-[10px] font-medium text-ink-muted uppercase tracking-widest">Guest</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-muted uppercase tracking-widest">Stay Duration</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-muted uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-muted uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredBookings.length > 0 ? filteredBookings.slice(0, 5).map(b => (
                <tr key={b.id} className="hover:bg-bg-sunken/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-ink-primary">{b.guest_name}</span>
                      <span className="text-xs text-ink-muted font-mono">{b.guest_phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-sm">
                      <span className="text-ink-secondary">{format(parseISO(b.check_in_date), 'dd MMM')} - {format(parseISO(b.check_out_date), 'dd MMM')}</span>
                      <span className="text-[10px] font-medium text-accent uppercase tracking-tighter">
                         {b.room_id ? `Room ${rooms.find(r => r.id === b.room_id)?.room_number || '??'}` : 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-ink-primary">
                    ₹{b.total_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedBooking(b)}
                      className="text-[10px] font-semibold text-accent uppercase tracking-widest hover:underline"
                    >
                      View Details
                    </button>
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

      {/* Modal: Custom Date Picker */}
      <Modal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Custom Report Period"
        footer={
          <div className="flex gap-3 w-full">
            <button className="btn btn-secondary flex-1" onClick={() => setShowCustomModal(false)}>Cancel</button>
            <button className="btn btn-accent flex-1" onClick={() => setShowCustomModal(false)}>Apply Range</button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
           <p className="text-xs text-ink-muted">Select the start and end dates for your performance report. Revenue and ADR will be recalculated instantly.</p>
           <div className="grid grid-cols-2 gap-4">
              <div className="field">
                 <label className="label">Start Date</label>
                 <input 
                    type="date" 
                    className="input" 
                    value={customStart} 
                    onChange={e => setCustomStart(e.target.value)} 
                 />
              </div>
              <div className="field">
                 <label className="label">End Date</label>
                 <input 
                    type="date" 
                    className="input" 
                    value={customEnd} 
                    onChange={e => setCustomEnd(e.target.value)} 
                 />
              </div>
           </div>
        </div>
      </Modal>

      {/* Booking Details Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Booking Overview"
      >
        {selectedBooking && (
          <div className="flex flex-col gap-6">
             <div className="p-4 bg-bg-sunken rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-ink-muted shadow-sm">
                   <UserCircle2 size={24} />
                </div>
                <div className="flex flex-col">
                   <h3 className="text-lg font-semibold text-ink-primary leading-none capitalize">{selectedBooking.guest_name}</h3>
                   <span className="text-xs text-ink-muted mt-1 font-mono">{selectedBooking.guest_phone}</span>
                </div>
                <div className="ml-auto">
                   <Badge type={selectedBooking.status} label={selectedBooking.status.replace('_', ' ')} />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="border border-border-subtle rounded-lg p-4 flex flex-col gap-1.5">
                   <span className="text-[10px] uppercase font-semibold text-ink-muted tracking-widest flex items-center gap-1.5">
                      <Calendar size={12} /> Stay Periods
                   </span>
                   <div className="flex flex-col">
                      <span className="text-sm font-semibold text-ink-primary">
                        {format(parseISO(selectedBooking.check_in_date), 'dd MMM')} - {format(parseISO(selectedBooking.check_out_date), 'dd MMM')}
                      </span>
                      <span className="text-[10px] font-mono text-ink-muted">2026 Season</span>
                   </div>
                </div>
                <div className="border border-border-subtle rounded-lg p-4 flex flex-col gap-1.5">
                   <span className="text-[10px] uppercase font-semibold text-ink-muted tracking-widest flex items-center gap-1.5">
                      <CreditCard size={12} /> Total Amount
                   </span>
                   <span className="text-xl font-mono font-semibold text-success">
                      ₹{selectedBooking.total_amount.toLocaleString()}
                   </span>
                </div>
             </div>

             <div className="bg-accent/5 border border-accent/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                   <span className="text-xs font-semibold text-accent uppercase tracking-widest">Property ID</span>
                   <span className="font-mono text-sm text-ink-primary">{selectedBooking.property_id}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                   <span className="text-xs font-semibold text-accent uppercase tracking-widest">Room Reference</span>
                   <span className="font-mono text-sm text-ink-primary">{selectedBooking.room_id}</span>
                </div>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
