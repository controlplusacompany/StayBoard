'use client';

import React from 'react';
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
  Info
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState('reports');
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('stayboard_user_role') || 'owner');
    }
  }, []);

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
    { id: 'audit', label: 'Audit Logs', icon: History, roles: ['owner', 'admin'] },
  ].filter(tab => userRole && tab.roles.includes(userRole));

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      {/* Header */}
      <div className="p-8 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-semibold text-[#011432]">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your property configuration and view business performance.</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Settings Navigation */}
        <div className="w-64 bg-white border-r border-gray-100 p-4 flex flex-col gap-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-accent/5 text-accent shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {activeTab === tab.id && <div className="ml-auto w-1 h-4 bg-accent rounded-full" />}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl">
            {activeTab === 'reports' && <ReportsContent />}
            {activeTab === 'financials' && <FinancialsContent />}
            {activeTab === 'property' && <PropertyContent />}
            {activeTab === 'rooms' && <RoomsContent />}
            {activeTab === 'taxes' && <TaxesContent />}
            {activeTab === 'security' && <SecurityContent />}
            {activeTab === 'staff' && <StaffContent />}
            {activeTab === 'audit' && <AuditContent />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Content Sections ──────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string, description: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-[#011432]">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function Card({ children, title, description }: { children: React.ReactNode, title?: string, description?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-base font-semibold text-[#011432]">{title}</h3>}
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function ReportsContent() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Performance Overview" description="Consolidated metrics across all your properties." />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Revenue (MTD)</p>
          <p className="text-2xl font-bold text-[#011432]">₹ 4,32,000</p>
          <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
            <ChevronRight className="-rotate-90" size={12} />
            +12% from last month
          </p>
        </Card>
        <Card>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Average Occupancy</p>
          <p className="text-2xl font-bold text-[#011432]">78.4%</p>
          <p className="text-xs text-blue-500 mt-2">Peak: Starry Nights (92%)</p>
        </Card>
        <Card>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">ADR</p>
          <p className="text-2xl font-bold text-[#011432]">₹ 2,450</p>
          <p className="text-xs text-gray-400 mt-2">Target: ₹ 2,800</p>
        </Card>
      </div>

      <Card title="Property Performance Comparison" description="Monthly revenue distribution between entities.">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Peace Hotel</span>
              <span>₹ 2,80,000 (65%)</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent w-[65%]" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Starry Nights</span>
              <span>₹ 1,52,000 (35%)</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 w-[35%]" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FinancialsContent() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Financial Summary" description="Tracking collections, expenses, and profit margins." />
      <Card title="Collection Breakdown" description="Distribution of payments received by method.">
        <div className="flex items-center gap-8 py-4">
          <div className="flex-1 space-y-3">
             {[
               { med: 'UPI / Online', val: '62%', color: 'bg-green-500' },
               { med: 'Cash', val: '28%', color: 'bg-orange-400' },
               { med: 'Card', val: '10%', color: 'bg-blue-500' }
             ].map(item => (
               <div key={item.med} className="flex items-center gap-3">
                 <div className={`w-2 h-2 rounded-full ${item.color}`} />
                 <span className="text-sm text-gray-600 flex-1">{item.med}</span>
                 <span className="text-sm font-bold text-[#011432]">{item.val}</span>
               </div>
             ))}
          </div>
          <div className="w-32 h-32 rounded-full border-[10px] border-green-500 border-r-orange-400 border-b-blue-500 opacity-20" />
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
            <span className="text-sm font-medium">Luxury Tax (for >₹7500)</span>
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

function StaffContent() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Staff Performance" description="Monitoring operational efficiency." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 text-[10px] font-bold text-gray-400 uppercase">Staff Name</th>
                <th className="text-center py-4 text-[10px] font-bold text-gray-400 uppercase">Bookings</th>
                <th className="text-right py-4 text-[10px] font-bold text-gray-400 uppercase">Check-ins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { name: 'Rahul K.', bookings: 124, checkins: 89 },
                { name: 'Sneha M.', bookings: 98, checkins: 102 },
                { name: 'Amit V.', bookings: 45, checkins: 38 }
              ].map(staff => (
                <tr key={staff.name}>
                  <td className="py-4 text-sm font-medium text-[#011432]">{staff.name}</td>
                  <td className="py-4 text-sm text-center text-gray-600">{staff.bookings}</td>
                  <td className="py-4 text-sm text-right text-gray-600">{staff.checkins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AuditContent() {
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('stayboard_user_role') || 'owner');
    }
  }, []);

  const isAdmin = userRole === 'admin';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Audit Logs" description="Recent administrative actions for traceability." />
      <Card>
        <div className="space-y-4">
          {[
            { action: 'Updated Tax Slab', user: 'Admin', time: '2 hours ago' },
            { action: 'Deleted Reservation #4521', user: 'Rahul K.', time: '5 hours ago' },
            { action: 'Changed Room Pricing', user: 'Owner', time: 'Yesterday' },
            { action: 'Staff PIN Reset', user: 'Admin', time: '3 days ago' },
            { action: 'Guest Checkout Override', user: 'Sneha M.', time: '4 days ago' }
          ]
          .filter(log => isAdmin ? true : log.user !== 'Admin')
          .map((log, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <History size={14} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#011432]">{log.action}</p>
                <p className="text-[10px] text-gray-400">{log.user} • {log.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
