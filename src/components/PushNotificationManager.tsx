'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from './ui/Toast';
import { supabase } from '@/lib/supabase';

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Error checking subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async () => {
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });

      // Get secure Supabase User ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast("Please log in to enable notifications", "error");
        return;
      }

      // Send subscription to server
      const response = await fetch('/api/notify/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, userId: user.id }),
      });

      if (!response.ok) throw new Error('Failed to save subscription');

      setSubscription(sub);
      setPermission('granted');
      toast("Native notifications enabled!", "success");
    } catch (err: any) {
      console.error('Subscription failed:', err);
      setPermission(Notification.permission);
      if (Notification.permission === 'denied') {
        toast("Permission denied. Reset settings to enable.", "error");
      } else {
        toast("Failed to enable notifications.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      setLoading(true);
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
        toast("Notifications disabled.", "info");
      }
    } catch (err) {
      console.error('Unsubscribe failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  const isBlocked = permission === 'denied';

  return (
    <button
      onClick={subscription ? unsubscribe : subscribe}
      disabled={loading || isBlocked}
      title={isBlocked ? "Notifications Blocked in Browser" : subscription ? "Notifications Enabled" : "Enable Native Notifications"}
      className={`relative w-9 h-9 flex items-center justify-center rounded-md cursor-pointer transition-all duration-200 ${
        isBlocked 
          ? 'bg-danger/10 text-danger cursor-not-allowed'
          : subscription 
            ? 'bg-accent/10 text-accent hover:bg-accent/20' 
            : 'bg-bg-sunken text-ink-muted hover:bg-bg-sunken/80'
      } ${loading ? 'opacity-50 cursor-wait' : ''}`}
    >
      {isBlocked ? (
        <BellOff size={18} />
      ) : subscription ? (
        <>
          <Bell size={18} className="animate-in fade-in zoom-in duration-300" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-success rounded-full border border-white" />
        </>
      ) : (
        <Bell size={18} />
      )}
    </button>
  );
}

// Utility to convert VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  if (!base64String) return new Uint8Array(0);
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
