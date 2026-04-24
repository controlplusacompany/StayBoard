'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Home, 
  Percent, 
  ShieldCheck, 
  Users, 
  BarChart3, 
  Wallet, 
  History, 
  Settings as SettingsIcon,
  ChevronRight,
  Info,
  ArrowLeft,
  Bell as BellIcon,
  BellOff,
  ShieldAlert
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationDebugger from '@/components/settings/NotificationDebugger';
import { 
  getMTDPerformance, 
  getFinancialDistribution, 
  getStaffPerformance 
} from '@/lib/services';
import { getAuditLogsStored, getSelectedProperty } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('reports');
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('stayboard_user_role') || 'owner';
      setUserRole(role);
      
      // ROLE GUARD
      if (role === 'reception' || role === 'staff') {
        router.push('/dashboard');
        return;
      }
    }

    // Listen for property changes
    const handleUpdate = () => fetchData();
    window.addEventListener('stayboard_update', handleUpdate);
    window.addEventListener('stayboard_property_change', handleUpdate);
    
    return () => {
      window.removeEventListener('stayboard_update', handleUpdate);
      window.removeEventListener('stayboard_property_change', handleUpdate);
    };
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const propertyId = getSelectedProperty() || 'all';
      
      const [performance, financials, staff, audit] = await Promise.all([
        getMTDPerformance(propertyId),
        getFinancialDistribution(propertyId),
        getStaffPerformance(propertyId),
        getAuditLogsStored()
      ]);

      setData({
        performance,
        financials,
        staff,
        audit
      });
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isAdmin = userRole === 'admin';
  const isOwner = userRole === 'owner';

  // Define tabs and their visibility
  const tabs = [
    { id: 'reports', label: 'Performance', icon: BarChart3, roles: ['owner', 'admin'] },
    { id: 'financials', label: 'Financials', icon: Wallet, roles: ['owner', 'admin'] },
    { id: 'property', label: 'Property Profile', icon: Building2, roles: ['admin', 'owner'] },
    { id: 'rooms', label: 'Room Config', icon: Home, roles: ['admin'] },
    { id: 'taxes', label: 'Taxes & Invoicing', icon: Percent, roles: ['admin', 'owner'] },
    { id: 'security', label: 'Security & PINs', icon: ShieldCheck, roles: ['admin'] },
    { id: 'staff', label: 'Staff Management', icon: Users, roles: ['admin', 'owner'] },
    { id: 'notifications', label: 'Notifications', icon: BellIcon, roles: ['admin', 'owner', 'reception'] },
    { id: 'audit', label: 'Audit Logs', icon: History, roles: ['owner', 'admin'] },
  ].filter(tab => userRole && tab.roles.includes(userRole));

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      {/* Header */}
      <div className="px-4 md:px-8 pt-4 pb-5 md:pt-5 md:pb-6 bg-white border-b border-gray-100">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-accent transition-colors mb-3 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>
        <h1 className="text-xl md:text-2xl font-semibold text-[#011432]">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your property configuration and view business performance.</p>
      </div>

      {/* Universal Horizontal Tab Bar — shown on ALL screen sizes */}
      <div className="bg-white border-b border-gray-100 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex gap-1 px-4 md:px-8 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Fix #22 — scroll content to top when switching tabs
                  document.getElementById('settings-content')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all shrink-0 border ${
                  activeTab === tab.id
                    ? 'bg-accent/8 text-accent border-accent/20 shadow-sm'
                    : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-Width Content Area */}
      <div id="settings-content" className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'reports' && (loading ? <LoadingSkeleton type="grid" /> : <ReportsContent data={data?.performance} />)}
          {activeTab === 'financials' && (loading ? <LoadingSkeleton type="card" /> : <FinancialsContent data={data?.financials} />)}
          {activeTab === 'property' && <PropertyContent />}
          {activeTab === 'rooms' && <RoomsContent />}
          {activeTab === 'taxes' && <TaxesContent />}
          {activeTab === 'security' && <SecurityContent />}
          {activeTab === 'staff' && (loading ? <LoadingSkeleton type="table" /> : <StaffContent data={data?.staff} />)}
          {activeTab === 'notifications' && <NotificationsContent isOwner={isOwner} />}
          {activeTab === 'audit' && (loading ? <LoadingSkeleton type="list" /> : <AuditContent data={data?.audit} isAdmin={isAdmin} />)}
        </div>
      </div>
    </div>
  );
}

// ── Content Sections ──────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string, description: string }) {
  return (
    <div className="mb-5 md:mb-8">
      <h2 className="text-lg md:text-xl font-semibold text-[#011432]">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function Card({ children, title, description }: { children: React.ReactNode, title?: string, description?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-6 shadow-sm">
      {(title || description) && (
        <div className="mb-4 md:mb-6">
          {title && <h3 className="text-sm md:text-base font-semibold text-[#011432]">{title}</h3>}
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function ReportsContent({ data }: { data: any }) {
  const revenue = data?.totalRevenue || 0;
  const occupancy = data?.occupancy || 0;
  const adr = data?.avgBookingValue || 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Performance Overview" description="Consolidated metrics across all your properties." />
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-8">
        <Card>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Revenue (MTD)</p>
          <p className="text-2xl font-bold text-[#011432]">₹ {revenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">{revenue > 0 ? 'Month-to-date total' : 'No revenue recorded yet'}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Occupancy</p>
          <p className="text-2xl font-bold text-[#011432]">{occupancy}%</p>
          <p className="text-xs text-gray-400 mt-2">{occupancy > 0 ? 'Monthly average' : 'Waiting for first booking'}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">ADR</p>
          <p className="text-2xl font-bold text-[#011432]">₹ {Math.round(adr).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">{adr > 0 ? 'Avg. Daily Rate' : 'No revenue data yet'}</p>
        </Card>
      </div>

      <Card title="Monthly Growth" description="Trailing revenue performance over the last 30 days.">
        <div className="h-24 flex items-end gap-1 px-2">
          {/* Mock visual for now as historical data needs more queries */}
          {[40, 70, 45, 90, 65, 80, 50, 100, 75, 85, 60, 95].map((h, i) => (
            <div key={i} className="flex-1 bg-accent/10 rounded-t-sm hover:bg-accent/30 transition-colors cursor-help group relative h-full">
               <div className="absolute bottom-0 w-full bg-accent rounded-t-sm transition-all duration-500" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FinancialsContent({ data }: { data: any[] }) {
  const items = data || [
    { med: 'UPI / Online', val: '0%', color: 'bg-green-500' },
    { med: 'Cash', val: '0%', color: 'bg-orange-400' },
    { med: 'Card', val: '0%', color: 'bg-blue-500' }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Financial Summary" description="Tracking collections, expenses, and profit margins." />
      <Card title="Collection Breakdown" description="Distribution of payments received by method.">
        <div className="flex items-center gap-8 py-4">
          <div className="flex-1 space-y-3">
             {items.map(item => (
               <div key={item.med} className="flex items-center gap-3">
                 <div className={`w-2 h-2 rounded-full ${item.color}`} />
                 <span className="text-sm text-gray-600 flex-1">{item.med}</span>
                 <span className="text-sm font-bold text-[#011432]">{item.val}</span>
               </div>
             ))}
          </div>
          <div className="relative w-32 h-32 rounded-full border-[10px] border-gray-100 overflow-hidden flex items-center justify-center">
             <Wallet size={32} className="text-gray-200" />
             {/* Simple visual representation */}
             <div className="absolute inset-0 border-[10px] border-accent border-r-transparent border-b-transparent opacity-20 rotate-45" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function PropertyContent() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Property Profile" description="Legal information and branding identity." />
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Property Legal Name</label>
            <input type="text" className="w-full h-11 px-4 bg-gray-50 border-none rounded-xl text-sm" defaultValue="Mononoke Stays Pvt Ltd" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Brand Name</label>
            <input type="text" className="w-full h-11 px-4 bg-gray-50 border-none rounded-xl text-sm" defaultValue="StayBoard" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Primary Address</label>
            <textarea className="w-full p-4 bg-gray-50 border-none rounded-xl text-sm" rows={2} defaultValue="Lane 4, High Street, South Delhi, Delhi - 110001" />
          </div>
        </div>
        <button className="mt-6 btn btn-accent px-6 text-sm">Save Changes</button>
      </Card>
    </div>
  );
}

function RoomsContent() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Room Categories" description="Manage your units and pricing structures." />
      <Card title="Active Categories" description="Click a category to manage individual unit numbers.">
        <div className="flex flex-col gap-2">
          {['Classic Deluxe', 'Premium Suite', 'Mixed Dorm (6-Bed)'].map(cat => (
            <div key={cat} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <Home size={18} className="text-gray-400" />
                <span className="text-sm font-medium text-[#011432]">{cat}</span>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-accent transition-colors" />
            </div>
          ))}
          <button className="mt-2 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-100 rounded-xl text-sm text-gray-400 hover:border-accent/30 hover:text-accent transition-all">
            + Add New Category
          </button>
        </div>
      </Card>
    </div>
  );
}

function TaxesContent() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Taxes & Billing" description="Configure GST slabs and invoice metadata." />
      <Card title="GST Slabs" description="Applied automatically to bookings based on room rates.">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium">Standard GST</span>
            <span className="text-sm font-bold text-accent">12.00%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium">Luxury Tax (for &gt;₹7500)</span>
            <span className="text-sm font-bold text-accent">18.00%</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SecurityContent() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Access Control" description="Manage property security and internal PINs." />
      <Card title="Property Access PIN" description="Used by staff to unlock operations for specific units.">
        <div className="flex items-center gap-4">
          <div className="flex-1 p-4 bg-gray-50 rounded-xl font-mono text-lg tracking-widest text-[#011432]">
            ••••••
          </div>
          <button className="btn btn-secondary px-6 text-sm">Reset PIN</button>
        </div>
        <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl">
          <Info size={16} className="text-blue-500 mt-0.5" />
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Changing this PIN will log out all staff members currently operating properties. They will need to re-enter the new PIN.
          </p>
        </div>
      </Card>
    </div>
  );
}

function StaffContent({ data }: { data: any[] }) {
  const staffList = data || [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Staff Performance" description="Monitoring operational efficiency across roles." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 text-[10px] font-bold text-gray-400 uppercase">Staff Name</th>
                <th className="text-center py-4 text-[10px] font-bold text-gray-400 uppercase">Role</th>
                <th className="text-center py-4 text-[10px] font-bold text-gray-400 uppercase">Bookings</th>
                <th className="text-right py-4 text-[10px] font-bold text-gray-400 uppercase">Check-ins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              { staffList.length > 0 ? staffList.map((staff, i) => (
                <tr key={i}>
                  <td className="py-4 text-sm font-medium text-[#011432]">{staff.name}</td>
                  <td className="py-4 text-xs text-center text-gray-500 capitalize">{staff.role}</td>
                  <td className="py-4 text-sm text-center text-gray-600 font-mono">{staff.bookings}</td>
                  <td className="py-4 text-sm text-right text-gray-600 font-mono">{staff.checkins}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-gray-400">No staff records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function NotificationsContent({ isOwner }: { isOwner: boolean }) {
  const { isSupported, config, updateConfig, toggleNotifications, loading, isBlocked } = useNotifications();

  if (!isSupported) {
    return (
      <Card title="Device Notifications" description="Notifications are not supported on this browser or device.">
        <div className="text-sm text-gray-400 py-4 italic">Browser notifications require a secure connection and a modern browser like Chrome or Safari.</div>
      </Card>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
      <SectionHeader title="Notification Controls" description="Configure when and how you receive alerts." />
      
      <Card title="Native Alerts" description="Receive real-time push notifications on this device.">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${config.enabled ? 'bg-accent/10 text-accent' : 'bg-gray-200 text-gray-400'}`}>
                {config.enabled ? <BellIcon size={18} /> : <BellOff size={18} />}
             </div>
             <div>
               <span className="text-sm font-medium block">Browser Push Notifications</span>
               <span className="text-[10px] text-gray-400">{config.enabled ? 'Currently active' : 'Disabled'}</span>
             </div>
          </div>
          
          <label className={`relative inline-flex items-center cursor-pointer ${loading || isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={config.enabled} 
              disabled={loading || isBlocked}
              onChange={toggleNotifications} 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
          </label>
        </div>
        
        {isBlocked && (
          <div className="mt-4 p-3 bg-danger/5 border border-danger/10 rounded-lg flex items-start gap-3">
            <Info size={14} className="text-danger mt-0.5" />
            <p className="text-[11px] text-danger/80">Permissions have been denied. Please reset the site settings in your browser address bar to allow alerts.</p>
          </div>
        )}
      </Card>

      {config.enabled && (
        <Card title="Delivery Preferences" description="Choose which activity types trigger a system alert.">
          <div className="space-y-1">
             {[
               { id: 'bookings', label: 'New Bookings', desc: 'When a new reservation is received' },
               { id: 'checkins', label: 'Check-ins', desc: 'When a guest arrives and checks in' },
               { id: 'checkouts', label: 'Check-outs', desc: 'When a guest pays and departs' },
               { id: 'payments', label: 'Payments', desc: 'When any standalone payment is logged' }
             ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <span className="text-sm font-medium block text-gray-700">{item.label}</span>
                    <span className="text-[10px] text-gray-400">{item.desc}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={(config as any)[item.id]} 
                      onChange={() => updateConfig({ [item.id]: !(config as any)[item.id] })} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Owner-Specific Diagnostic Tools */}
      {isOwner && <NotificationDebugger />}
    </div>
  );
}

function AuditContent({ data, isAdmin }: { data: any[], isAdmin: boolean }) {
  const logs = data || [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Audit Logs" description="Recent administrative actions for traceability." />
      <Card>
        <div className="space-y-4">
          {logs.length > 0 ? logs
          .filter(log => isAdmin ? true : log.user_role !== 'admin')
          .slice(0, 15)
          .map((log, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                <History size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#011432] truncate">{log.action}</p>
                <p className="text-[10px] text-gray-400">
                  {log.user_email || 'System'} • {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="text-[10px] font-bold px-2 py-1 bg-gray-50 text-gray-400 rounded-md uppercase">
                {log.entity_type || 'General'}
              </div>
            </div>
          )) : (
            <div className="py-8 text-center text-sm text-gray-400">No audit logs available.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

function LoadingSkeleton({ type }: { type: 'grid' | 'card' | 'table' | 'list' }) {
  if (type === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
        ))}
        <div className="col-span-full h-40 bg-gray-200 rounded-2xl mt-4" />
      </div>
    );
  }
  if (type === 'table') {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded-lg w-full" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-48 bg-gray-200 rounded-2xl w-full" />
    </div>
  );
}
