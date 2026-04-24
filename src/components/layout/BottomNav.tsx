'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Layout, 
  CalendarDays, 
  ClipboardList, 
  Sparkles, 
  MoreHorizontal,
  Users,
  BarChart3,
  Wifi,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { logout } from '@/lib/store';

const MOBILE_ITEMS = [
  { label: 'Dash', icon: Layout, href: '/dashboard' },
  { label: 'Calendar', icon: CalendarDays, href: '/calendar' },
  { label: 'Reserve', icon: ClipboardList, href: '/reservations' },
  { label: 'Cleaning', icon: Sparkles, href: '/housekeeping' },
];

const MORE_ITEMS = [
  { label: 'Guests', icon: Users, href: '/guests' },
  { label: 'Finance', icon: BarChart3, href: '/finance' },
  { label: 'Distribution', icon: Wifi, href: '/distribution' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Overlay backdrop - Now more sensitive */}
      {showMore && (
        <div 
          className="fixed inset-0 bg-transparent z-[55] md:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-[60] md:hidden pb-safe">
        {/* Floating More Menu */}
        {showMore && (
          <div 
            className="absolute bottom-[calc(100%+8px)] right-4 w-56 bg-white rounded-3xl border border-border-subtle shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
          >
            <div className="p-2 flex flex-col gap-1">
              <div className="px-4 py-3 border-b border-border-subtle mb-1 flex items-center justify-between">
                 <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">More Options</span>
                 <button onClick={() => setShowMore(false)} className="text-ink-muted hover:text-ink-primary">
                    <X size={14} />
                 </button>
              </div>

              {MORE_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all
                      ${isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-ink-secondary hover:bg-bg-sunken'}
                    `}
                  >
                    <Icon size={18} />
                    <span className="text-sm tracking-tight">{item.label}</span>
                  </Link>
                );
              })}

              <div className="h-px bg-border-subtle my-1 mx-2" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-danger hover:bg-danger/5 transition-all text-left"
              >
                <LogOut size={18} />
                <span className="text-sm font-semibold tracking-tight">Log Out</span>
              </button>
            </div>
          </div>
        )}

        {/* glassmorphic nav bar */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-2xl border-t border-border-subtle shadow-[0_-8px_30px_rgb(0,0,0,0.06)]" />
        
        <div className="relative flex items-center justify-around h-16 px-2">
          {MOBILE_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 gap-1.5 relative h-full group"
              >
                <div className={`
                  w-12 h-8 flex items-center justify-center rounded-full transition-all duration-400 ease-spring
                  ${isActive ? 'bg-accent/10 text-accent scale-110' : 'text-ink-muted group-hover:bg-bg-sunken'}
                `}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-300" />
                </div>
                <span className={`
                  text-[10px] uppercase font-bold tracking-widest transition-all duration-300
                  ${isActive ? 'text-accent opacity-100' : 'text-ink-muted/60 opacity-100'}
                `}>
                  {item.label}
                </span>
                
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full animate-in fade-in zoom-in duration-500" />
                )}
              </Link>
            );
          })}

          {/* More Button Trigger */}
          <button 
            onClick={() => setShowMore(!showMore)}
            className={`
              flex flex-col items-center justify-center flex-1 gap-1.5 h-full transition-all duration-300 relative
              ${showMore ? 'text-accent' : 'text-ink-muted'}
            `}
          >
            <div className={`
              w-12 h-8 flex items-center justify-center rounded-full transition-all duration-400 ease-spring
              ${showMore ? 'bg-accent/10 text-accent scale-110' : 'text-ink-muted hover:bg-bg-sunken'}
            `}>
              <MoreHorizontal size={22} strokeWidth={showMore ? 2.5 : 2} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest">More</span>

            {showMore && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
