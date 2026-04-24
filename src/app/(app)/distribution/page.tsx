'use client';

import React, { useState } from 'react';
import { 
  Wifi, 
  Tag, 
  Globe
} from 'lucide-react';
import RatesPage from '../rates/page';
import ChannelsPage from '../channels/page';

const TABS = [
  { id: 'rates', label: 'Rate Management', icon: Tag },
  { id: 'channels', label: 'OTA Distribution', icon: Wifi },
];

export default function DistributionHub() {
  const [activeTab, setActiveTab] = useState('rates');

  return (
    <div className="flex flex-col min-h-full bg-bg-canvas animate-slide-up">
      {/* Standardized Design Header (Matching Reservations & Stays) */}
      <div className="p-6 md:p-10 flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl md:text-5xl font-display text-ink-primary tracking-tighter font-medium text-balance">Distribution Hub</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
             <div className="bg-bg-sunken border border-border-subtle rounded-2xl px-5 py-3 flex items-center gap-4">
                <Globe size={18} className="text-accent" />
                <div className="flex flex-col">
                   <span className="text-[10px] text-ink-muted uppercase font-bold tracking-widest leading-none mb-1">Global parity</span>
                   <span className="text-xs font-bold text-ink-primary">100% Channel Sync</span>
                </div>
             </div>
          </div>
        </header>

        {/* Standardized Tab Navigation Row */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-2 md:p-1.5 rounded-2xl border border-border-subtle shadow-sm w-fit">
          <div className="flex items-center gap-1">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                      : 'text-ink-muted hover:text-ink-primary hover:bg-bg-sunken'}
                  `}
                >
                  <Icon size={16} />
                  <span className="text-sm font-semibold tracking-tight uppercase whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hub Content Viewport */}
        <div className="mt-2">
          {activeTab === 'rates' && <RatesPage isHub />}
          {activeTab === 'channels' && <ChannelsPage isHub />}
        </div>
      </div>
    </div>
  );
}
