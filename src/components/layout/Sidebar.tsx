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
  User,
  ShieldCheck
} from 'lucide-react';
import { logout } from '@/lib/store';

const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',      icon: Layout },
  { label: 'Calendar',     href: '/calendar',       icon: CalendarDays },
  { label: 'Reservations', href: '/reservations',   icon: ClipboardList },
  { label: 'Housekeeping', href: '/housekeeping',   icon: Sparkles },
  { label: 'Guests',       href: '/guests',         icon: Users },
  { label: 'Finance',      href: '/finance',        icon: BarChart3 },
  { label: 'Distribution', href: '/distribution',   icon: Wifi },
];

const RECEPTION_NAV_ITEMS = ['Dashboard', 'Calendar', 'Reservations', 'Housekeeping', 'Guests'];

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
    // 1. RBAC Check for Hubs
    if (item.label === 'Finance' || item.label === 'Distribution') {
      const hasAccess = userRole === 'owner' || userRole === 'admin' || userRole === 'md' || userRole === 'superadmin';
      if (!hasAccess) return false;
    }
    
    // 2. Reception Restriction
    if (isReception) {
      if (!RECEPTION_NAV_ITEMS.includes(item.label)) return false;
    }

    // 3. Mobile Redundancy Filter (Hide items already in BottomNav)
    const BOTTOM_NAV_LABELS = ['Dashboard', 'Calendar', 'Reservations', 'Housekeeping'];
    const isInBottomNav = BOTTOM_NAV_LABELS.includes(item.label);
    
    // On mobile, if item is in bottom nav, hide it from the "More" drawer
    if (isMobileOpen && isInBottomNav && typeof window !== 'undefined' && window.innerWidth < 768) {
      return false;
    }

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
          fixed left-0 top-0 bottom-0 z-[80]
          w-[280px] md:w-[76px] md:top-[56px] bg-white border-r border-border-subtle
          flex flex-col py-6 md:py-2 overflow-y-auto overflow-x-hidden no-scrollbar
          transition-transform duration-300 ease-out
          md:translate-x-0
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        {/* Nav Items */}
        <nav className="flex-1 flex flex-col items-center gap-1 px-2 pb-10">
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
                  relative w-full flex md:flex-col items-center md:justify-center gap-4 md:gap-1
                  py-3 md:py-2 px-6 md:px-1 rounded-2xl transition-all duration-500 ease-spring
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
                  {item.label === 'Reservations' ? 'Reserve' :
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
