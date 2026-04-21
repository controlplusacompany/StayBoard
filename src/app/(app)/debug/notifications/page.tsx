'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/lib/supabase';
import { Shield, Bell, CheckCircle, XCircle, Send, Smartphone } from 'lucide-react';

export default function DebugNotifications() {
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
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await fetch('/api/notify/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'StayBoard Test Alert! 🛎️',
          body: 'If you see this, your iPhone push is working perfectly.',
          url: '/dashboard',
          userId: user?.id,
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
    <div className="min-h-screen bg-bg p-6">
      <div className="max-w-md mx-auto space-y-6">
        <header className="text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-accent" size={32} />
          </div>
          <h1 className="text-2xl font-bold font-display">Notification Debugger</h1>
          <p className="text-ink-muted">Troubleshoot your iPhone alerts</p>
        </header>

        <section className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Smartphone size={18} /> Device Status
          </h2>
          
          <div className="space-y-3">
            <StatusRow 
              label="Browser Support" 
              status={isSupported} 
              text={isSupported ? "Supported" : "Not Supported (Use Safari Home Screen)"} 
            />
            <StatusRow 
              label="Permission" 
              status={permission === 'granted'} 
              text={permission} 
            />
            <StatusRow 
              label="Subscribed" 
              status={!!subscription} 
              text={subscription ? "Active Session" : "No Active Session"} 
            />
          </div>

          <button 
            onClick={toggleNotifications}
            className={`w-full py-3 rounded-lg font-medium transition-all ${
              subscription ? 'bg-danger/10 text-danger hover:bg-danger/20' : 'bg-accent text-white hover:bg-accent-hover'
            }`}
          >
            {subscription ? 'Disable Notifications' : 'Enable Notifications'}
          </button>
        </section>

        <section className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Bell size={18} /> Database Status
          </h2>
          
          <div className="p-4 bg-bg-sunken rounded-lg text-sm font-mono break-all">
            {checkingDb ? "Checking..." : dbSubscription ? (
              <div>
                <p className="text-success mb-2 font-bold flex items-center gap-2">
                  <CheckCircle size={14} /> {dbSubscription.length} device(s) registered
                </p>
                <div className="opacity-60 overflow-hidden text-ellipsis">
                  {JSON.stringify(dbSubscription[0]?.subscription_json).substring(0, 50)}...
                </div>
              </div>
            ) : (
              <p className="text-danger">No device found in database for your user ID.</p>
            )}
          </div>
          
          <button 
            onClick={checkDbStatus}
            className="w-full py-2 text-sm text-accent hover:underline"
          >
            Refresh DB Status
          </button>
        </section>

        {subscription && (
          <section className="bg-accent/5 rounded-xl border border-accent/20 p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2 text-accent">
              <Send size={18} /> Diagnostic Test
            </h2>
            <p className="text-sm text-ink-muted">
              Click below to send a high-priority alert <b>specifically to your device.</b> Lock your phone immediately after clicking.
            </p>
            <button 
              onClick={sendTestPush}
              className="w-full bg-accent text-white py-3 rounded-lg font-bold shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
            >
              <Send size={18} /> Send Test Alert
            </button>
            {testStatus && (
              <div className="text-center p-2 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {testStatus}
              </div>
            )}
          </section>
        )}

        <footer className="text-xs text-ink-muted text-center italic">
          Tip: On iPhone, ensure you are using the "Add to Home Screen" version and not just Safari.
        </footer>
      </div>
    </div>
  );
}

function StatusRow({ label, status, text }: { label: string, status: boolean, text: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-muted">{label}</span>
      <div className={`flex items-center gap-1.5 text-sm font-medium ${status ? 'text-success' : 'text-danger'}`}>
        {status ? <CheckCircle size={14} /> : <XCircle size={14} />}
        {text}
      </div>
    </div>
  );
}
