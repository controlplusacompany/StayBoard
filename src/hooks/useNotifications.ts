'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';

export interface NotificationConfig {
  enabled: boolean;
  bookings: boolean;
  checkins: boolean;
  checkouts: boolean;
  payments: boolean;
}

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: false,
  bookings: true,
  checkins: true,
  checkouts: true,
  payments: true,
};

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_CONFIG);
  const { toast } = useToast();

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  // Load Config from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stayboard_notif_config');
      if (saved) {
        try {
          setConfig(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse notif config", e);
        }
      }
    }
  }, []);

  // Check support and current subscription
  const checkSubscription = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      setLoading(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      
      // Update config.enabled based on subscription
      if (sub && !config.enabled) {
        updateConfig({ enabled: true });
      } else if (!sub && config.enabled) {
        updateConfig({ enabled: false });
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [config.enabled]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const updateConfig = (updates: Partial<NotificationConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    localStorage.setItem('stayboard_notif_config', JSON.stringify(newConfig));
    window.dispatchEvent(new Event('stayboard_notif_update'));
  };

  const subscribe = async () => {
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast("Please log in to enable notifications", "error");
        return;
      }

      const response = await fetch('/api/notify/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, userId: user.id }),
      });

      if (!response.ok) throw new Error('Failed to save subscription');

      setSubscription(sub);
      setPermission('granted');
      updateConfig({ enabled: true });
      toast("Native notifications enabled!", "success");
    } catch (err: any) {
      console.error('Subscription failed:', err);
      setPermission(Notification.permission);
      toast("Failed to enable notifications.", "error");
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
        updateConfig({ enabled: false });
        toast("Notifications disabled.", "info");
      }
    } catch (err) {
      console.error('Unsubscribe failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = () => {
    if (subscription) unsubscribe();
    else subscribe();
  };

  return {
    isSupported,
    subscription,
    permission,
    loading,
    config,
    updateConfig,
    toggleNotifications,
    isBlocked: permission === 'denied'
  };
}

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
