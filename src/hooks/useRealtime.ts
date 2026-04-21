import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtime(callback: () => void, tables: string[] = ['bookings', 'rooms', 'invoices']) {
  useEffect(() => {
    const channels = tables.map(table => {
      return supabase
        .channel(`realtime-${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          () => {
          // Realtime event handled
            callback();
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [callback, JSON.stringify(tables)]);
}
