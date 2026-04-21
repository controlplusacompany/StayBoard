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
  CalendarDays,
  ClipboardList,
  LogOut,
  User
} from 'lucide-react';
import { logout } from '@/lib/store';

const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',     icon: Layout },
  { label: 'Availability', href: '/calendar',       icon: CalendarDays },
  { label: 'Reservations', href: '/reservations',   icon: ClipboardList },
  { label: 'Housekeeping', href: '/housekeeping',   icon: Sparkles },
  { label: 'Invoices',     href: '/invoices',       icon: ReceiptText },
  { label: 'Rates',        href: '/rates',          icon: Tag },
  { label: 'Guests',       href: '/guests',         icon: Users },
  { label: 'Reports',      href: '/reports',        icon: BarChart3 },
  { label: 'Channels',     href: '/channels',      icon: Wifi },
];

const RECEPTION_NAV_ITEMS = ['Dashboard', 'Availability', 'Reservations', 'Housekeeping', 'Guests'];

export default function Sidebar({ isMobileOpen, onCloseMobile }: { isMobileOpen?: boolean; onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('stayboard_user_role') || 'owner');
    }
  }, []);

  const isReception = userRole === 'reception';
  const isOwner = userRole === 'owner';

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.label === 'Channels' || item.label === 'Rates') return userRole === 'admin' || userRole === 'md' || userRole === 'superadmin';
    if (isReception) return RECEPTION_NAV_ITEMS.includes(item.label);
    return true;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed left-0 top-[56px] bottom-0 z-[80]
          w-[76px] bg-white border-r border-border-subtle
          flex flex-col py-3 overflow-hidden
          transition-transform duration-300 ease-out
          md:translate-x-0
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        {/* Nav Items */}
        <nav className="flex-1 flex flex-col items-center gap-1.5 px-2">
          {filteredNavItems.map((item, index) => {
            const isActive =
              pathname === item.href ||
              (item.label === 'Dashboard' && pathname.startsWith('/property/'));
            const Icon = item.icon;

            let href = item.href || '/dashboard';

            if (isReception && item.label === 'Dashboard') {
              const userProp = typeof window !== 'undefined' ? localStorage.getItem('stayboard_user_property') : null;
              href = userProp ? `/property/${userProp}` : '/dashboard';
            } else if (propertyId) {
              href = `${href}?propertyId=${propertyId}`;
            }

            return (
              <Link
                key={item.label}
                href={href}
                onClick={() => {
                  onCloseMobile?.();
                  if (isOwner && item.label === 'Dashboard') {
                    localStorage.removeItem('stayboard_master_property');
                    window.dispatchEvent(new Event('stayboard_update'));
                  }
                }}
                style={{
                  transitionDelay: `${index * 50}ms`,
                  opacity: isMounted ? 1 : 0,
                  transform: isMounted ? 'translateX(0)' : 'translateX(-10px)'
                }}
                className={`
                  relative w-full flex flex-col items-center justify-center gap-1
                  py-2 px-1 rounded-2xl transition-all duration-500 ease-spring
                  no-underline group active:scale-95
                  ${isActive
                    ? 'text-accent'
                    : 'text-ink-muted/60 hover:bg-accent/5 hover:text-ink-primary hover:scale-[1.03]'
                  }
                `}
              >
                {/* Active Precision Indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-6 bg-accent rounded-r-full shadow-[0_0_8px_rgba(var(--accent-rgb),0.3)] animate-in slide-in-from-left-2 duration-300" />
                )}

                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ease-spring
                    ${isActive
                      ? 'bg-accent text-white shadow-md shadow-accent/20 scale-105'
                      : 'bg-white group-hover:bg-accent/5'
                    }
                  `}
                >
                  <Icon
                    size={20}
                    strokeWidth={2}
                    className={isActive ? 'animate-in zoom-in-75 duration-300' : 'transition-transform group-hover:scale-110'}
                  />
                </div>

                <span className={`text-[10.5px] font-display font-medium tracking-tight leading-none text-center transition-all duration-200
                  ${isActive ? 'text-accent' : 'text-ink-muted/80 group-hover:text-ink-primary'}
                `}>
                  {item.label === 'Availability' ? 'Calendar' :
                   item.label === 'Reservations' ? 'Reserve' :
                   item.label === 'Housekeeping' ? 'Cleaning' :
                   item.label}
                </span>
              </Link>
            );
          })}
        </nav>

      </aside>
    </>
  );
}
