'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, ChevronDown, Check, Building2, Layout, Home, Plus, Settings, LogOut, X, Menu } from 'lucide-react';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('stayboard_user_role') || 'owner');
      setUserEmail(localStorage.getItem('stayboard_user_email') || 'owner@example.com');
    }
  }, []);

  const isReception = userRole === 'reception';
  const isSuperAdmin = userRole === 'superadmin';
  const isOwner = userRole === 'owner';
  const userInitials = isReception ? 'R' : isOwner ? 'O' : isSuperAdmin ? 'MD' : 'RK';

  const [isSwitcherOpen, setIsSwitcherOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = React.useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState(false);
  const [newPropertyName, setNewPropertyName] = React.useState('');

  // In a real app, this would come from a user context
  const userPlan = 'free'; 
  const propertyCount = 1; 

  const properties = [
    { id: '010', name: 'Peace Hotel', type: 'Hotel' },
    { id: '011', name: 'Starry Nights', type: 'Hostel' },
    { id: '012', name: 'Starry Night Homes', type: 'Airbnb' }
  ];


  const [currentProperty, setCurrentProperty] = React.useState('All Properties');

  React.useEffect(() => {
    const propertyId = searchParams.get('propertyId');
    let prop = 'All Properties';
    
    if (propertyId) {
      const found = properties.find(p => p.id === propertyId);
      if (found) prop = found.name;
    } else if (pathname.includes('/property/')) {
       prop = pathname.includes('010') ? 'Peace Hotel' : pathname.includes('011') ? 'Starry Nights' : 'Starry Night Homes';
    }
    
    setCurrentProperty(prop);
  }, [pathname, searchParams]);


  const closeAll = () => {
    setIsSwitcherOpen(false);
    setIsUserMenuOpen(false);
    setIsNotifOpen(false);
  };

  const handleSignOut = () => {
    router.push('/login');
    closeAll();
  };

  const handleOnboardNew = () => {
    closeAll();
    if (userPlan === 'free' && propertyCount >= 1) {
      setIsUpgradeOpen(true);
    } else {
      setIsAddPropertyOpen(true);
    }
  };

  return (
    <>
      {/* Invisible overlay for closing menus */}
      {(isSwitcherOpen || isUserMenuOpen || isNotifOpen) && (
        <div className="fixed inset-0 z-[90]" onClick={closeAll} />
      )}

      <nav className="navbar fixed top-0 left-0 right-0 z-[100] h-[56px] bg-white/70 backdrop-blur-[12px] border-b border-border-subtle flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden flex items-center justify-center p-1.5 -ml-1.5 text-ink-primary hover:bg-bg-sunken rounded-md transition-colors"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 no-underline group" onClick={closeAll}>
            <span className="font-display font-extrabold text-xl text-ink-primary tracking-tighter">StayBoard</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1 animate-pulse" />
          </Link>

          {/* Property Switcher */}
          <div className="relative">
          <button 
            onClick={() => {
              const newState = !isSwitcherOpen;
              closeAll();
              setIsSwitcherOpen(newState);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 bg-bg-sunken border border-border-subtle rounded-full cursor-pointer hover:bg-white hover:shadow-sm transition-all duration-120 ease-out max-w-[200px] ${isSwitcherOpen ? 'ring-2 ring-accent/10 border-accent bg-white' : ''}`}
          >
            <span className="text-[13px] font-medium text-ink-secondary truncate max-w-[100px] md:max-w-none">{currentProperty}</span>
            <ChevronDown size={14} className={`text-ink-muted transition-transform duration-200 shrink-0 ${isSwitcherOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSwitcherOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-border-subtle rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
              <div className="px-3 pb-2 mb-1 border-b border-border-subtle/50">
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest pl-2">My Entities</p>
              </div>

              <Link 
                href="/dashboard"
                onClick={() => {
                  closeAll();
                  const params = new URLSearchParams(window.location.search);
                  params.delete('propertyId');
                  router.push(`${pathname}${params.toString() ? '?' + params.toString() : ''}`);
                }}
                className={`flex items-center justify-between px-4 py-3 hover:bg-bg-sunken text-sm font-medium transition-colors ${!(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('propertyId')) ? 'bg-accent/5 text-accent border-l-2 border-accent' : 'text-ink-secondary'}`}
              >
                <div className="flex items-center gap-3">
                  <Layout size={16} className={!(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('propertyId')) ? 'text-accent' : 'text-ink-muted'} />
                  <span>All Properties</span>
                </div>
                {!(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('propertyId')) && <Check size={14} className="text-accent" />}
              </Link>
              
              <div className="h-px bg-border-subtle/30 my-1" />
              
              {properties.map(p => (
                <button 
                  key={p.id}
                  onClick={() => {
                    closeAll();
                    const params = new URLSearchParams(window.location.search);
                    params.set('propertyId', p.id);
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3 hover:bg-bg-sunken text-sm font-medium transition-colors text-left ${(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('propertyId') === p.id) ? 'bg-accent/5 text-accent border-l-2 border-accent' : 'text-ink-secondary'}`}
                >
                  <div className="flex items-center gap-3">
                    <Home size={16} className={(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('propertyId') === p.id) ? 'text-accent' : 'text-ink-muted'} />
                    <span>{p.name}</span>
                  </div>
                  {(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('propertyId') === p.id) ? (
                    <Check size={14} className="text-accent" />
                  ) : null}
                </button>
              ))}

              <div className="mt-2 pt-2 border-t border-border-subtle/50">
                <button 
                  onClick={() => {
                    closeAll();
                    router.push('/booking/new');
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-accent hover:bg-accent/5 transition-colors"
                >
                  <Plus size={16} />
                  <span>New Booking</span>
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => {
                const newState = !isNotifOpen;
                closeAll();
                setIsNotifOpen(newState);
              }}
              className={`relative w-9 h-9 flex items-center justify-center rounded-md cursor-pointer hover:bg-bg-sunken transition-colors ${isNotifOpen ? 'bg-bg-sunken' : ''}`}
            >
              <Bell size={18} className="text-ink-secondary" />
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-danger text-white font-sans font-semibold text-[9px] leading-4 text-center rounded-full">3</span>
            </button>

            {isNotifOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-border-subtle rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink-primary">Notifications</h3>
                  <button className="text-[11px] font-bold text-accent hover:underline">Mark all read</button>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="px-4 py-3 border-b border-border-subtle/30 hover:bg-sunken transition-colors group relative cursor-pointer">
                      <p className="text-xs text-ink-secondary leading-relaxed pr-4">New booking confirmed for <b>Amit Verma</b> at ABC Hostel</p>
                      <p className="text-[10px] text-ink-muted mt-1">2 mins ago</p>
                      <button className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-border-subtle rounded text-ink-muted">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <div 
              onClick={() => {
                const newState = !isUserMenuOpen;
                closeAll();
                setIsUserMenuOpen(newState);
              }}
              className={`w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-[12px] font-bold cursor-pointer transition-all ${isUserMenuOpen ? 'ring-2 ring-accent ring-offset-2' : ''}`}
            >
              {userInitials}
            </div>

            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-border-subtle rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                <div className="px-4 py-3 border-b border-border-subtle mb-1">
                  <p className="text-xs font-bold text-ink-primary">
                    {isReception ? 'Reception' : isSuperAdmin ? 'Monish Dhaga' : isOwner ? 'Operations Manager' : 'Rajesh Khanna'}
                  </p>
                  <p className="text-[10px] text-ink-muted">
                    {isReception ? 'Front Desk' : isSuperAdmin ? 'Super Admin' : isOwner ? 'Property Owner' : 'Owner · Pro Plan'}
                  </p>
                </div>
                <Link 
                  href="/settings" 
                  onClick={closeAll}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-ink-secondary hover:bg-sunken transition-colors"
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </Link>
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

      {/* MODAL: Add Property */}
      <Modal
        isOpen={isAddPropertyOpen}
        onClose={() => setIsAddPropertyOpen(false)}
        title="Add New Property"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsAddPropertyOpen(false)}>Cancel</button>
            <button 
              className="btn btn-accent px-8" 
              onClick={() => {
                toast("Property added successfully", "success");
                setIsAddPropertyOpen(false);
              }}
            >
              Step 2: Add Rooms
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
              placeholder={newPropertyName ? "" : "e.g. Blue Lagoon Resort"} 
              value={newPropertyName}
              onChange={(e) => setNewPropertyName(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">Property Type</label>
            <div className="grid grid-cols-2 gap-3">
              {['bnb', 'hotel', 'hostel', 'villa'].map(t => (
                <button key={t} className="btn btn-outline py-3 text-xs font-bold uppercase tracking-widest">{t}</button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: Upgrade to Pro */}
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
