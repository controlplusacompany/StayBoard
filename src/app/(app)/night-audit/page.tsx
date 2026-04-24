'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Calendar,
  Lock
} from 'lucide-react';
import { getSelectedProperty } from '@/lib/store';
import { performNightAudit, getNightAudits, checkAuditStatus } from '@/lib/nightAudit';
import { NightAuditEntry } from '@/types';
import { format, subDays } from 'date-fns';
import { formatINR } from '@/lib/formatting';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

export default function NightAuditPage({ isHub = false }: { isHub?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [audits, setAudits] = useState<NightAuditEntry[]>([]);
  const [isPerforming, setIsPerforming] = useState(false);
  const [isTodayDone, setIsTodayDone] = useState(false);
  const propertyId = getSelectedProperty();
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const loadData = async () => {
    if (!propertyId || propertyId === 'all') return;
    const [history, status] = await Promise.all([
      getNightAudits(propertyId),
      checkAuditStatus(propertyId, yesterdayStr)
    ]);
    setAudits(history);
    setIsTodayDone(status);
  };

  useEffect(() => {
    // ROLE GUARD
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('stayboard_user_role');
      if (role === 'reception' || role === 'staff') {
        router.push('/dashboard');
        return;
      }
    }
    loadData();
  }, [propertyId]);

  const handleRunAudit = async () => {
    if (!propertyId || propertyId === 'all') return;
    setIsPerforming(true);
    try {
      await performNightAudit(propertyId);
      toast('Night Audit completed successfully', 'success');
      loadData();
    } catch (error) {
      console.error(error);
      toast('Failed to perform Night Audit', 'error');
    } finally {
      setIsPerforming(false);
    }
  };

  return (
    <div className={isHub ? "p-0 flex flex-col gap-10 animate-slide-up" : "p-6 md:p-10 flex flex-col gap-10 animate-slide-up bg-bg-canvas min-h-full"}>
      {!isHub && (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-xl text-accent">
                  <ShieldCheck size={28} />
              </div>
              <h1 className="text-4xl md:text-5xl font-display text-ink-primary tracking-tighter font-medium underline decoration-accent/20 underline-offset-8">Night Audit</h1>
            </div>
            <p className="text-ink-muted max-w-md">Industrial-grade financial day closure. Resets room statuses, posts daily charges, and locks the business day.</p>
          </div>

          {!isTodayDone ? (
            <button 
              onClick={handleRunAudit}
              disabled={isPerforming || propertyId === 'all'}
              className="btn btn-accent btn--lg flex items-center gap-3 shadow-xl shadow-accent/20"
            >
              {isPerforming ? <RefreshCw size={20} className="animate-spin" /> : <Lock size={20} />}
              <span>Run Audit for {format(subDays(new Date(), 1), 'dd MMM')}</span>
            </button>
          ) : (
            <div className="bg-success/10 border border-success/20 rounded-2xl px-6 py-4 flex items-center gap-4">
              <CheckCircle2 className="text-success" size={24} />
              <div className="flex flex-col">
                  <span className="text-sm font-bold text-ink-primary">Day Successfully Closed</span>
                  <span className="text-[10px] text-ink-muted uppercase tracking-widest">Next audit available in 14 hours</span>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Audit Action Header for Hub Mode */}
      {isHub && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-border-subtle shadow-sm">
           <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Procedural Status</span>
              <p className="max-w-md text-sm text-ink-muted leading-relaxed font-medium">Reset room statuses, post daily charges, and lock the current business day.</p>
           </div>
           
           {!isTodayDone ? (
            <button 
              onClick={handleRunAudit}
              disabled={isPerforming || propertyId === 'all'}
              className="btn btn-accent flex items-center gap-3 shadow-lg shadow-accent/15"
            >
              {isPerforming ? <RefreshCw size={18} className="animate-spin" /> : <Lock size={18} />}
              <span>Run Night Audit</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 text-success bg-success/5 px-4 py-2 rounded-xl border border-success/10">
              <CheckCircle2 size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Audit Complete</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Status Card */}
        <div className="lg:col-span-2 flex flex-col gap-6">
           <section className="bg-white rounded-3xl border border-border-subtle p-8 shadow-sm">
              <h3 className="text-lg font-display font-semibold text-ink-primary mb-6 flex items-center gap-2">
                <Clock size={20} className="text-accent" />
                Audit Status: {format(new Date(), 'EEEE, dd MMM yyyy')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-bg-sunken rounded-2xl p-6 border border-border-subtle hover:border-accent/40 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-[10px] font-black text-ink-muted uppercase tracking-widest">Business Day</span>
                       <Badge type={isTodayDone ? 'checked_in' : 'pending'} label={isTodayDone ? 'Closed' : 'Open'} />
                    </div>
                    <div className="text-3xl font-display font-bold text-ink-primary">
                       {format(subDays(new Date(), 1), 'dd MMM')}
                    </div>
                 </div>

                 <div className="bg-bg-sunken rounded-2xl p-6 border border-border-subtle flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-ink-muted uppercase tracking-widest">Audit Policy</span>
                    </div>
                    <ul className="flex flex-col gap-2">
                       <li className="flex items-center gap-2 text-xs text-ink-secondary">
                          <CheckCircle2 size={14} className="text-success" />
                          <span>Auto-post room charges</span>
                       </li>
                       <li className="flex items-center gap-2 text-xs text-ink-secondary">
                          <CheckCircle2 size={14} className="text-success" />
                          <span>Flag delayed checkouts</span>
                       </li>
                       <li className="flex items-center gap-2 text-xs text-ink-secondary">
                          <CheckCircle2 size={14} className="text-success" />
                          <span>Generate daily P&L summary</span>
                       </li>
                    </ul>
                 </div>
              </div>
           </section>

           <section className="flex flex-col gap-6">
              <h3 className="text-[10px] font-black text-ink-muted uppercase tracking-[0.2em] ml-1">Recent Audit History</h3>
              <div className="flex flex-col gap-3">
                 {audits.map(audit => (
                   <div key={audit.id} className="bg-white border border-border-subtle rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-bg-sunken flex items-center justify-center text-ink-muted group-hover:bg-accent/5 group-hover:text-accent transition-colors">
                            <Calendar size={20} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-ink-primary">Day of {format(parseISO(audit.business_date), 'dd MMMM')}</span>
                            <span className="text-[10px] text-ink-muted uppercase tracking-tight font-medium">Performed by {audit.performed_by} • {format(parseISO(audit.performed_at), 'hh:mm a')}</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-8">
                         <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase font-bold text-ink-muted tracking-widest">Day Revenue</span>
                            <span className="text-base font-sans font-bold text-ink-primary">{formatINR(audit.total_revenue)}</span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase font-bold text-ink-muted tracking-widest">Occupancy</span>
                            <span className="text-base font-sans font-bold text-ink-primary">{audit.occupancy_percentage}%</span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase font-bold text-ink-muted tracking-widest">Flags</span>
                            <div className="flex gap-2 mt-0.5">
                               {audit.no_shows_count > 0 && <span className="bg-danger/10 text-danger text-[9px] px-1.5 py-0.5 rounded-full font-black">{audit.no_shows_count} NS</span>}
                               {audit.delayed_checkouts_count > 0 && <span className="bg-warning/10 text-warning text-[9px] px-1.5 py-0.5 rounded-full font-black">{audit.delayed_checkouts_count} DL</span>}
                               {audit.no_shows_count === 0 && audit.delayed_checkouts_count === 0 && <span className="bg-success/10 text-success text-[9px] px-1.5 py-0.5 rounded-full font-black">CLEAN</span>}
                            </div>
                         </div>
                         <button className="text-ink-muted hover:text-accent transition-all">
                            <ArrowRight size={20} />
                         </button>
                      </div>
                   </div>
                 ))}

                 {audits.length === 0 && (
                    <div className="py-12 border-2 border-dashed border-border-subtle rounded-3xl flex flex-col items-center justify-center text-center px-10">
                       <TrendingUp className="text-ink-muted opacity-20 mb-4" size={40} />
                       <h4 className="text-ink-primary font-bold">No Audit History</h4>
                       <p className="text-ink-muted text-sm mt-1">Ready to start industrial financial monitoring.</p>
                    </div>
                 )}
              </div>
           </section>
        </div>

        {/* Action / Warning Sidebar */}
        <div className="flex flex-col gap-6">
           <div className="bg-gradient-to-br from-ink-primary to-black text-white rounded-3xl p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-1000" />
              <h3 className="text-lg font-display font-semibold mb-6 flex items-center gap-2">
                <ShieldCheck size={20} className="text-accent" />
                Audit Intelligence
              </h3>
              
              <div className="space-y-6">
                 <div>
                    <span className="text-[9px] text-accent font-black uppercase tracking-widest mb-2 block">Today's Focus</span>
                    <p className="text-xs text-white/70 leading-relaxed font-medium">Night Audit will automatically sync all OTA bookings and ensure inventory parity across Makemytrip and Agoda.</p>
                 </div>
                 
                 <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                       <AlertTriangle size={16} className="text-warning" />
                       <span className="text-[11px] font-black text-warning uppercase">Risk Warning</span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">Closing the business day is permanent. Ensure all manual payments for yesterday are already entered before proceeding.</p>
                 </div>
              </div>
           </div>

           <div className="bg-bg-sunken border border-border-subtle rounded-3xl p-8 flex flex-col gap-6">
              <h4 className="text-xs font-black text-ink-muted uppercase tracking-widest">Recommended Actions</h4>
              <div className="space-y-4">
                 <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5" />
                    <p className="text-xs text-ink-secondary">Review {yesterdayStr} cancelled bookings</p>
                 </div>
                 <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5" />
                    <p className="text-xs text-ink-secondary">Check for unallocated payments</p>
                 </div>
                 <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5" />
                    <p className="text-xs text-ink-secondary">Validate current occupancy: {audits[0]?.occupancy_percentage || 0}%</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function parseISO(date: string): Date {
  return new Date(date);
}

function Badge({ type, label }: { type: string, label: string }) {
  const colors: Record<string, string> = {
    'checked_in': 'bg-success/10 text-success border-success/20',
    'pending': 'bg-warning/10 text-warning border-warning/20',
  };
  return (
    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${colors[type]}`}>
      {label}
    </span>
  );
}
