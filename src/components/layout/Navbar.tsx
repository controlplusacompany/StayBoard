'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, ChevronDown, Check, Building2, Layout, Home, Plus, Settings, LogOut, X, Menu, User, ArrowLeft } from 'lucide-react';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useNewBooking } from '../booking/NewBookingProvider';
import { getSelectedProperty, setSelectedProperty } from '@/lib/store';
import { format } from 'date-fns';
import NotificationList from './NotificationList';

export default function Navbar({ onMenuClick, isSettingsPage }: { onMenuClick?: () => void; isSettingsPage?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { open: openNewBooking } = useNewBooking();

  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('stayboard_user_role') || 'owner');
      setUserEmail(localStorage.getItem('stayboard_user_email') || 'owner@example.com');
    }
    return () => clearInterval(timer);
  }, []);

  const isReception = userRole === 'reception';
  const isSuperAdmin = userRole === 'superadmin';
  const isOwner = userRole === 'owner';
  const userInitials = isReception ? 'R' : isOwner ? 'O' : isSuperAdmin ? 'MD' : 'RK';

  const [isSwitcherOpen, setIsSwitcherOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = React.useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState(false);
  const [newPropertyName, setNewPropertyName] = React.useState('');

  const userPlan = 'free';
  const propertyCount = 1;

  const properties = [
    { id: '010', name: 'Peace Hotel', type: 'Hotel' },
    { id: '011', name: 'Starry Nights', type: 'Hostel' }
  ];

  const [currentPropertyLabel, setCurrentPropertyLabel] = React.useState('All Properties');

  React.useEffect(() => {
    const syncProperty = () => {
      const selectedId = getSelectedProperty();
      if (!selectedId) {
        setCurrentPropertyLabel('All Properties');
      } else {
        const found = properties.find(p => p.id === selectedId);
        setCurrentPropertyLabel(found ? found.name : 'All Properties');
      }
    };

    syncProperty();
    window.addEventListener('storage', syncProperty);
    window.addEventListener('stayboard_update', syncProperty);
    return () => {
      window.removeEventListener('storage', syncProperty);
      window.removeEventListener('stayboard_update', syncProperty);
    };
  }, []);

  const closeAll = () => {
    setIsSwitcherOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleSignOut = () => {
    document.cookie = "sb_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Priority=High";
    document.cookie = "sb_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Priority=High";
    document.cookie = "sb_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Priority=High";
    document.cookie = "sb_user_property=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Priority=High";

    localStorage.removeItem('stayboard_user_role');
    localStorage.removeItem('stayboard_user_email');
    localStorage.removeItem('stayboard_user_property');

    router.push('/login');
    closeAll();
  };

  return (
    <>
      {(isSwitcherOpen || isUserMenuOpen) && (
        <div className="fixed inset-0 z-[90]" onClick={closeAll} />
      )}

      <nav className="navbar fixed top-0 left-0 right-0 z-[100] h-[56px] bg-white/70 backdrop-blur-[12px] border-b border-border-subtle flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Menu hidden on mobile because of BottomNav */}

          <Link
            href={isReception ? `/property/${typeof window !== 'undefined' ? localStorage.getItem('stayboard_user_property') || '010' : '010'}` : "/dashboard"}
            className="flex items-center gap-2 no-underline group"
            onClick={() => {
              closeAll();
              if (isOwner) {
                localStorage.removeItem('stayboard_master_property');
                window.dispatchEvent(new Event('stayboard_update'));
              }
            }}
          >
            <img src="/logo.png" alt="StayBoard Logo" className="h-[32px] md:h-[40px] w-auto" />
          </Link>

          {!isReception && (
            <div className="relative">
              <button
                onClick={() => {
                  const newState = !isSwitcherOpen;
                  closeAll();
                  setIsSwitcherOpen(newState);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 bg-bg-sunken border border-border-subtle rounded-full cursor-pointer hover:bg-white hover:shadow-sm transition-all duration-120 ease-out max-w-[200px] ${isSwitcherOpen ? 'ring-2 ring-accent/10 border-accent bg-white' : ''}`}
              >
                <span className="text-[13px] font-medium text-ink-secondary truncate max-w-[100px] md:max-w-none">{currentPropertyLabel}</span>
                <ChevronDown size={14} className={`text-ink-muted transition-transform duration-200 shrink-0 ${isSwitcherOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSwitcherOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-border-subtle rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                  <div className="px-3 pb-2 mb-1 border-b border-border-subtle/50">
                    <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest pl-2">My Entities</p>
                  </div>

                  <button
                    onClick={() => {
                      closeAll();
                      setSelectedProperty(null);
                      if (pathname !== '/dashboard') {
                        router.push('/dashboard');
                      }
                    }}
                    className={`flex items-center justify-between w-full px-4 py-3 hover:bg-bg-sunken text-sm font-medium transition-colors ${!getSelectedProperty() ? 'bg-accent/5 text-accent border-l-2 border-accent' : 'text-ink-secondary'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Layout size={16} className={!getSelectedProperty() ? 'text-accent' : 'text-ink-muted'} />
                      <span>All Properties</span>
                    </div>
                    {!getSelectedProperty() && <Check size={14} className="text-accent" />}
                  </button>

                  <div className="h-px bg-border-subtle my-1" />

                  {properties.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        closeAll();
                        setSelectedProperty(p.id);
                        // Navigation Logic: Only jump if NOT already on the dashboard
                        if (pathname !== '/dashboard') {
                          router.push(`/property/${p.id}`);
                        }
                      }}
                      className={`flex items-center justify-between w-full px-4 py-3 hover:bg-bg-sunken text-sm font-medium transition-colors text-left ${(getSelectedProperty() === p.id) ? 'bg-accent/5 text-accent border-l-2 border-accent' : 'text-ink-secondary'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Home size={16} className={(getSelectedProperty() === p.id) ? 'text-accent' : 'text-ink-muted'} />
                        <span>{p.name}</span>
                      </div>
                      {(getSelectedProperty() === p.id) ? (
                        <Check size={14} className="text-accent" />
                      ) : null}
                    </button>
                  ))}

                  <div className="mt-2 pt-2 border-t-2 border-border-subtle/30">
                    <button
                      onClick={() => {
                        closeAll();
                        openNewBooking();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-accent hover:bg-accent/5 transition-colors"
                    >
                      <Plus size={16} />
                      <span>New Booking</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            {mounted && (
              <>
                <span className="text-[13px] font-semibold text-accent leading-none mb-1 uppercase tracking-wider">
                  {format(currentTime, 'h:mm a')}
                </span>
                <span className="text-[10px] font-medium text-accent uppercase tracking-[0.2em] leading-none opacity-80">
                  {format(currentTime, 'EEEE, dd MMM yyyy')}
                </span>
              </>
            )}
          </div>

          {mounted && (
            <NotificationList />
          )}

          <div className="relative">
            <div
              onClick={() => {
                const newState = !isUserMenuOpen;
                closeAll();
                setIsUserMenuOpen(newState);
              }}
              className={`w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center cursor-pointer transition-all ${isUserMenuOpen ? 'ring-2 ring-accent ring-offset-2' : ''}`}
            >
              <User size={16} />
            </div>

            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-border-subtle rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                <div className="px-4 py-3 border-b border-border-subtle mb-1">
                  <p className="text-xs font-medium text-ink-primary">
                    {isReception ? 'Reception' : isSuperAdmin ? 'Monish Dhaga' : userRole === 'admin' ? 'System Administrator' : 'Operations Manager'}
                  </p>
                  <p className="text-[10px] text-ink-muted">
                    {isReception ? 'Front Desk' : isSuperAdmin ? 'Super Admin' : userRole === 'admin' ? 'Admin' : 'Property Owner'}
                  </p>
                </div>
                {(userRole === 'admin' || userRole === 'owner') && (
                  <Link
                    href="/settings"
                    onClick={closeAll}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-ink-secondary hover:bg-sunken transition-colors"
                  >
                    <Settings size={14} />
                    <span>Settings</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-danger/5 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <Modal
        isOpen={isAddPropertyOpen}
        onClose={() => setIsAddPropertyOpen(false)}
        title="Add New Property"
        footer={
          <>
            <button className="btn btn-secondary px-8" onClick={() => setIsAddPropertyOpen(false)}>Cancel</button>
            <button
              className="btn btn-accent px-10 shadow-lg shadow-accent/20"
              onClick={() => {
                toast("Property added successfully", "success");
                setIsAddPropertyOpen(false);
              }}
            >
              Add Rooms
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="field">
            <label className="label">Property Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Blue Lagoon Resort"
              value={newPropertyName}
              onChange={(e) => setNewPropertyName(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        title="Upgrade to Pro"
      >
        <div className="flex flex-col items-center text-center gap-5 py-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-light/10 border border-accent/10 flex items-center justify-center text-accent">
            <Plus size={32} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-display text-ink-primary">Add multiple properties</h3>
            <p className="text-sm text-ink-muted px-4">The free plan only supports 1 property. Upgrade to Pro to manage up to 5 properties with advanced analytics.</p>
          </div>
          <button
            className="btn btn-accent w-full py-4 mt-4"
            onClick={() => {
              toast("Redirecting to pricing...", "info");
              setIsUpgradeOpen(false);
            }}
          >
            Explore Pro Plans
          </button>
        </div>
      </Modal>
    </>
  );
}
