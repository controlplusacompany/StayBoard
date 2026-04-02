'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  Layout, 
  Sparkles, 
  ReceiptText, 
  Tag, 
  Users, 
  BarChart3, 
  Wifi, 
  Settings,
  CalendarDays
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: Layout },
  { label: 'Availability', href: '/calendar', icon: CalendarDays },
  { label: 'Housekeeping', href: '/housekeeping', icon: Sparkles },
  { label: 'Invoices', href: '/invoices', icon: ReceiptText },
  { label: 'Rates', href: '/rates', icon: Tag },
  { label: 'Guests', href: '/guests', icon: Users },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Channels', href: '/channels', icon: Wifi },
];

const RECEPTION_NAV_ITEMS = ['Dashboard', 'Availability', 'Housekeeping', 'Rates', 'Guests'];


export default function Sidebar({ isMobileOpen, onCloseMobile }: { isMobileOpen?: boolean; onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('stayboard_user_role') || 'owner');
    }
  }, []);

  const isReception = userRole === 'reception';
  const isOwner = userRole === 'owner';
  
  const filteredNavItems = isReception 
    ? NAV_ITEMS.filter(item => RECEPTION_NAV_ITEMS.includes(item.label))
    : isOwner
      ? NAV_ITEMS.filter(item => item.label !== 'Channels')
      : NAV_ITEMS;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-ink-primary/20 backdrop-blur-sm z-[70] md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}
      <aside className={`fixed left-0 top-[56px] bottom-0 w-64 border-r border-border-subtle bg-white z-[80] flex flex-col py-6 transition-transform duration-300 ease-out md:translate-x-0 ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
      <nav className="flex-1 flex flex-col gap-1 px-4">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname.startsWith('/property/'));
          const Icon = item.icon;
          
          // Append propertyId if present
          const href = propertyId ? `${item.href}?propertyId=${propertyId}` : item.href;
          
          return (
            <Link
              key={item.href}
              href={href}
              onClick={onCloseMobile}
              className={`
                flex items-center gap-3 h-11 px-4 rounded-xl transition-all duration-200 group/nav
                font-sans font-medium text-[14px] leading-none no-underline
                ${isActive 
                  ? 'bg-accent text-white shadow-md shadow-accent/20' 
                  : 'text-ink-primary/80 hover:bg-accent/5 hover:text-accent'}
              `}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} className={isActive ? 'text-white' : 'group-hover/nav:text-accent text-ink-primary/60 transition-colors'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 py-4 border-t border-border-subtle bg-bg-sunken/30">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
            {isReception ? 'R' : isOwner ? 'O' : 'MD'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-ink-primary truncate">
              {isReception ? 'Reception' : isOwner ? 'Property Owner' : 'Operations Manager'}
            </span>
            <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider">
              {userRole || 'MD'}
            </span>
          </div>
        </div>
        
        {!isReception && !isOwner && (
          <Link
            href="/settings"
            onClick={onCloseMobile}
            className={`
              flex items-center gap-3 h-10 px-4 rounded-xl mt-2 transition-all duration-220
              font-sans font-medium text-[13px] leading-none no-underline
              ${pathname === '/settings' 
                ? 'bg-accent text-white shadow-md shadow-accent/20' 
                : 'text-ink-secondary hover:bg-white hover:text-accent hover:shadow-sm'}
            `}
          >
            <Settings size={16} className={pathname === '/settings' ? 'text-white' : 'text-ink-secondary'} />
            <span>Settings</span>
          </Link>
        )}
      </div>
    </aside>
    </>
  );
}
