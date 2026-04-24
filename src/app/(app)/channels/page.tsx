'use client';

import React, { useState } from 'react';
import { 
  Globe, 
  Settings2, 
  RefreshCw, 
  CheckCircle2,
  AlertCircle,
  Link2,
  Unlink
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';

type OTA = 'booking_com' | 'agoda' | 'airbnb' | 'makemytrip' | 'expedia' | 'goibibo';

interface ChannelStatus {
  id: OTA;
  name: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync?: string;
  markup: number;
  logoColor: string;
}

export default function ChannelsPage({ isHub = false }: { isHub?: boolean }) {
  const { toast } = useToast();
  
  // Mock state for OTAs
  const [channels, setChannels] = useState<ChannelStatus[]>([
    { id: 'booking_com', name: 'Booking.com', status: 'connected', lastSync: new Date().toISOString(), markup: 15, logoColor: '#003580' },
    { id: 'airbnb', name: 'Airbnb', status: 'connected', lastSync: new Date(Date.now() - 15 * 60000).toISOString(), markup: 0, logoColor: '#FF5A5F' },
    { id: 'makemytrip', name: 'MakeMyTrip', status: 'disconnected', markup: 18, logoColor: '#E21A22' },
    { id: 'agoda', name: 'Agoda', status: 'disconnected', markup: 20, logoColor: '#000000' },
    { id: 'expedia', name: 'Expedia', status: 'error', lastSync: new Date(Date.now() - 3600 * 60000).toISOString(), markup: 10, logoColor: '#000048' },
    { id: 'goibibo', name: 'Goibibo', status: 'disconnected', markup: 12, logoColor: '#1A4A8B' },
  ]);

  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const toggleConnection = (id: OTA) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === id) {
        if (ch.status === 'disconnected') {
          toast(`Connecting to ${ch.name}...`, 'info');
          return { ...ch, status: 'connected', lastSync: new Date().toISOString() };
        } else {
          toast(`Disconnected from ${ch.name}`, 'warning');
          return { ...ch, status: 'disconnected' };
        }
      }
      return ch;
    }));
  };

  const handleManualSync = () => {
    setIsSyncingAll(true);
    toast("Initiating full inventory sync across all connected OTAs...", "info");
    
    // simulate sync delay
    setTimeout(() => {
      setChannels(prev => prev.map(ch => 
        ch.status === 'connected' || ch.status === 'error' 
          ? { ...ch, status: 'connected', lastSync: new Date().toISOString() } 
          : ch
      ));
      setIsSyncingAll(false);
      toast("Sync completed successfully.", "success");
    }, 2500);
  };

  const activeConnections = channels.filter(c => c.status === 'connected' || c.status === 'error').length;

  return (
    <div className={isHub ? "p-0 flex flex-col gap-8 animate-slide-up" : "p-6 md:p-10 flex flex-col gap-8 animate-slide-up bg-bg-canvas min-h-full"}>
      {!isHub && (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-medium text-accent uppercase tracking-[0.3em] font-sans">Distribution Network</span>
            <h1 className="text-4xl md:text-5xl font-display text-ink-primary tracking-tighter font-medium text-balance">Channel Manager</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white border border-border-subtle rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-none">
              <Globe className="text-ink-muted" size={18} />
              <span className="font-mono font-bold text-ink-primary text-base">{activeConnections} / {channels.length}</span>
              <span className="text-xs text-ink-muted uppercase font-bold tracking-wider">Connected</span>
            </div>
            
            <button 
              onClick={handleManualSync}
              disabled={isSyncingAll || activeConnections === 0}
              className={`btn shadow-sm flex-1 sm:flex-none flex items-center justify-center gap-2 ${isSyncingAll ? 'bg-bg-sunken text-ink-muted' : 'bg-accent text-white hover:bg-accent-dark border-transparent'}`}
            >
              <RefreshCw size={18} className={isSyncingAll ? 'animate-spin' : ''} />
              <span>{isSyncingAll ? 'Syncing...' : 'Sync All Channels'}</span>
            </button>
          </div>
        </header>
      )}

      {/* Hub Action Header */}
      {isHub && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-border-subtle shadow-sm">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-xl text-accent">
                 <Globe size={24} />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Network Status</span>
                 <p className="text-sm font-semibold text-ink-primary">Managing {activeConnections} active OTA connections.</p>
              </div>
           </div>
           
           <button 
              onClick={handleManualSync}
              disabled={isSyncingAll || activeConnections === 0}
              className={`btn btn--sm shadow-sm flex items-center gap-2 ${isSyncingAll ? 'bg-bg-sunken text-ink-muted' : 'bg-accent text-white'}`}
            >
              <RefreshCw size={14} className={isSyncingAll ? 'animate-spin' : ''} />
              <span>{isSyncingAll ? 'Syncing...' : 'Sync All Channels'}</span>
            </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {channels.map((channel) => (
          <div key={channel.id} className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col gap-6">
            
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${channel.logoColor}15`, color: channel.logoColor }}>
                     {/* Mock Logo using just first letter since importing proper SVGs isn't requested */}
                     <span className="font-display font-bold text-2xl">{channel.name.charAt(0)}</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-ink-primary">{channel.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {channel.status === 'connected' && <CheckCircle2 size={14} className="text-success" />}
                      {channel.status === 'disconnected' && <Unlink size={14} className="text-ink-muted" />}
                      {channel.status === 'error' && <AlertCircle size={14} className="text-danger" />}
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        channel.status === 'connected' ? 'text-success' : 
                        channel.status === 'error' ? 'text-danger' : 'text-ink-muted'
                      }`}>
                        {channel.status}
                      </span>
                    </div>
                  </div>
               </div>
               
               {/* Toggle Switch CSS Mock */}
               <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={channel.status === 'connected' || channel.status === 'error'} onChange={() => toggleConnection(channel.id)} />
                  <div className="w-11 h-6 bg-border-strong rounded-full peer peer-checked:bg-accent peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-subtle after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
               </label>
            </div>

            <div className={`grid grid-cols-2 gap-4 border-t border-border-subtle pt-6 transition-opacity ${channel.status === 'disconnected' ? 'opacity-40 pointer-events-none' : ''}`}>
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wide flex items-center gap-1">
                   <RefreshCw size={12} /> Last Synced
                 </span>
                 <span className="text-sm font-bold text-ink-primary font-mono">
                   {channel.lastSync ? format(new Date(channel.lastSync), 'dd MMM, HH:mm') : 'Never'}
                 </span>
               </div>
               
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wide flex items-center gap-1">
                   <Settings2 size={12} /> Rate Markup
                 </span>
                 <div className="flex items-center gap-2">
                   <span className="text-sm font-bold text-ink-primary font-mono">+{channel.markup}%</span>
                   <button className="text-xs font-bold text-accent hover:underline">Edit</button>
                 </div>
               </div>
            </div>

            {channel.status === 'error' && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 flex gap-3 mt-auto">
                 <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
                 <p className="text-xs text-danger font-medium leading-relaxed">
                   Sync failed during the last attempt due to API mismatch. Please verify your credentials or manually sync again.
                 </p>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
