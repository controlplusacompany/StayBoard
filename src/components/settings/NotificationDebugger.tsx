'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/lib/supabase';
import { Shield, Bell, CheckCircle, XCircle, Send, Smartphone, Search } from 'lucide-react';

export default function NotificationDebugger() {
  const { isSupported, subscription, permission, loading, toggleNotifications } = useNotifications();
  const [dbSubscription, setDbSubscription] = useState<any>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    checkDbStatus();
  }, [subscription]);

  const checkDbStatus = async () => {
    try {
      setCheckingDb(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (data) setDbSubscription(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingDb(false);
    }
  };

  const sendTestPush = async () => {
    try {
      setTestStatus('Sending...');
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/notify/push/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          title: 'StayBoard Test Alert! 🛎️',
          body: 'If you see this, your iPhone push is working perfectly.',
          url: '/dashboard',
          userId: session?.user?.id,
          broadcast: false
        }),
      });

      const result = await response.json();
      if (result.success && result.deliveredCount > 0) {
        setTestStatus('Success! Check your device.');
      } else {
        setTestStatus('Sent, but no devices confirmed receipt. Info: ' + JSON.stringify(result));
      }
    } catch (err: any) {
      setTestStatus('Error: ' + err.message);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 mt-8 border-t border-gray-100 pt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
          <Shield className="text-accent" size={20} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#011432]">Owner Diagnostics</h3>
          <p className="text-xs text-gray-500">Troubleshoot mobile alerts and background delivery.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Device Status */}
        <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Smartphone size={14} /> Local Device
          </h4>
          
          <div className="space-y-3">
            <StatusRow 
              label="Push Supported" 
              status={isSupported} 
              text={isSupported ? "Yes" : "No (Use Safari PWA)"} 
            />
            <StatusRow 
              label="System Permission" 
              status={permission === 'granted'} 
              text={permission} 
            />
            <StatusRow 
              label="Active Session" 
              status={!!subscription} 
              text={subscription ? "Connected" : "Disconnected"} 
            />
          </div>
        </div>

        {/* DB Status */}
        <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Bell size={14} /> Cloud Registry
          </h4>
          
          <div className="text-sm">
            {checkingDb ? (
              <span className="text-gray-400 italic">Checking registry...</span>
            ) : dbSubscription && dbSubscription.length > 0 ? (
              <div className="flex items-center gap-2 text-success font-medium">
                <CheckCircle size={14} /> 
                <span>{dbSubscription.length} Device(s) Registered</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-danger font-medium">
                <XCircle size={14} /> 
                <span>No Registered Devices</span>
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
              For background alerts, your phone MUST be registered here.
            </p>
          </div>
          
          <button 
            onClick={checkDbStatus}
            className="text-[10px] text-accent font-bold uppercase hover:underline flex items-center gap-1"
          >
            <Search size={10} /> Refresh Cloud Status
          </button>
        </div>
      </div>

      {/* Action Area */}
      <div className="bg-accent/5 rounded-xl border border-accent/20 p-5">
        <h4 className="text-sm font-semibold text-accent mb-2 flex items-center gap-2">
          <Send size={16} /> Send Test Alert
        </h4>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          This sends a high-priority "Wake Up" signal directly to your iPhone. 
          <b> Lock your phone immediately after clicking</b> to test background delivery.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={sendTestPush}
            disabled={!subscription}
            className="bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            <Send size={14} /> Send High-Priority Test
          </button>
          
          {!subscription && (
            <button 
              onClick={toggleNotifications}
              className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Re-register device
            </button>
          )}
        </div>

        {testStatus && (
          <div className="mt-4 p-3 bg-white/50 rounded-lg border border-accent/10 text-xs font-medium text-accent animate-in fade-in slide-in-from-top-1">
            {testStatus}
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3">
        <Info className="text-blue-500 shrink-0" size={16} />
        <p className="text-[11px] text-blue-700 leading-relaxed">
          <b>iPhone Pro Tip:</b> Native push notifications ONLY work if you have used the <b>"Add to Home Screen"</b> feature in Safari. Standard browser tabs cannot receive alerts when the phone is locked.
        </p>
      </div>
    </div>
  );
}

function StatusRow({ label, status, text }: { label: string, status: boolean, text: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-gray-500">{label}</span>
      <div className={`flex items-center gap-1.5 text-[11px] font-bold ${status ? 'text-success' : 'text-danger'}`}>
        {status ? <CheckCircle size={12} /> : <XCircle size={12} />}
        <span className="uppercase">{text}</span>
      </div>
    </div>
  );
}

function Info({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  );
}
