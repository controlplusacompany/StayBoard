'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, History, Check, User, CreditCard, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import Link from 'next/link';

export default function NotificationList() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastViewed, setLastViewed] = useState<number>(0);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    // Load last viewed timestamp
    const saved = localStorage.getItem('stayboard_notif_last_viewed');
    if (saved) setLastViewed(parseInt(saved));

    fetchActivities();
    
    // 1. REAL-TIME SUBSCRIPTION: Listen for new activities
    console.log('Initiating Realtime subscription for booking_activities...');
    const channel = supabase
      .channel('activities-live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_activities'
        },
        (payload) => {
          console.log('LIVE UPDATE RECEIVED:', payload);
          fetchActivities(); // Refresh list instantly
        }
      )
      .subscribe((status) => {
        console.log('Realtime Status Change:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('CRITICAL: Realtime failed to connect. Check if Realtime is enabled in Supabase dashboard for booking_activities.');
        }
      });

    // 2. Fallback: Refresh every minute
    const interval = setInterval(fetchActivities, 60000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_activities')
        .select('*')
        .not('action', 'eq', 'STAFF_PIN_RESET') // Exclude sensitive admin actions
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivities(data || []);

      // Check if any activity is newer than last viewed
      if (data && data.length > 0) {
        const newest = new Date(data[0].created_at).getTime();
        const savedViewed = parseInt(localStorage.getItem('stayboard_notif_last_viewed') || '0');
        setHasNew(newest > savedViewed);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const toggleOpen = () => {
    if (!isOpen) {
      // Mark as viewed when opening
      const now = Date.now();
      setLastViewed(now);
      localStorage.setItem('stayboard_notif_last_viewed', now.toString());
      setHasNew(false);
    }
    setIsOpen(!isOpen);
  };

  const getIcon = (action: string) => {
    switch (action) {
      case 'CHECKIN': return <Check size={14} className="text-success" />;
      case 'CHECKOUT': return <ExternalLink size={14} className="text-danger" />;
      case 'NEW_BOOKING': return <Bell size={14} className="text-accent" />;
      case 'PAYMENT': return <CreditCard size={14} className="text-info" />;
      case 'UPDATE': return <History size={14} className="text-orange-400" />;
      case 'GUEST_SYNC': return <User size={14} className="text-gray-400" />;
      default: return <Bell size={14} className="text-gray-400" />;
    }
  };

  const getLabel = (activity: any) => {
    const action = activity.action;
    const details = activity.details;
    const guest = details?.guest || 'Guest';

    switch (action) {
      case 'CHECKIN': return `Checked In: ${guest}`;
      case 'CHECKOUT': return `Checked Out: ${guest}`;
      case 'NEW_BOOKING': return `New Booking: ${guest}`;
      case 'PAYMENT': return `Payment Received: ₹${details?.amount || 0}`;
      case 'UPDATE': return `Updated booking for ${guest}`;
      case 'GUEST_SYNC': return `Guest details synced: ${guest}`;
      default: return activity.action;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className={`relative w-9 h-9 flex items-center justify-center rounded-md cursor-pointer transition-all duration-200 border border-transparent
          ${isOpen ? 'bg-accent/10 text-accent border-accent/20' : 'bg-bg-sunken text-ink-muted hover:bg-bg-sunken/80'}
          ${hasNew ? 'animate-pulse-subtle' : ''}
        `}
      >
        <Bell size={18} />
        {hasNew && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-white animate-in zoom-in duration-300" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-border-subtle rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            <div className="px-4 py-2 border-b border-border-subtle mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Recent Activity</span>
              <Link href="/settings?tab=notifications" onClick={() => setIsOpen(false)} className="text-[10px] font-medium text-accent hover:underline">
                Settings
              </Link>
            </div>

            <div className="max-h-[320px] overflow-y-auto no-scrollbar">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="px-4 py-3 hover:bg-bg-sunken transition-colors flex gap-3 border-b border-gray-50 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(activity.action)}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-[12px] font-medium text-ink-primary leading-tight truncate">
                        {getLabel(activity)}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center flex flex-col items-center gap-2">
                  <Bell size={24} className="text-ink-muted/20" />
                  <p className="text-[11px] text-ink-muted">No recent activities</p>
                </div>
              )}
            </div>

            <div className="px-4 pt-2 border-t border-border-subtle mt-1">
              <Link
                href="/reservations"
                onClick={() => setIsOpen(false)}
                className="block text-center text-[10px] font-bold text-accent hover:text-accent-dark py-1 tracking-wider uppercase"
              >
                View Reservations
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
