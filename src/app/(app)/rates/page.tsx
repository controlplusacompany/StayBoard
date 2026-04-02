'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Percent,
  Trash2,
  DollarSign,
  Layers,
  Bed,
  Users,
  Tent
} from 'lucide-react';
import Select from '@/components/ui/Select';
import { getStoredRateRules, addRateRule, deleteRateRule } from '@/lib/store';
import { RateRule, PropertyType } from '@/types';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';

export default function RatesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<RateRule[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('stayboard_user_role'));
      setUserEmail(localStorage.getItem('stayboard_user_email'));
    }
    refreshRules();
  }, []);
  
  const canManageRates = userEmail === 'dhagamonish00@gmail.com' || (userRole !== 'owner' && userRole !== 'reception' && userRole !== null && userRole !== 'staff');
  const [ruleName, setRuleName] = useState('');
  const [roomType, setRoomType] = useState<RateRule['room_type']>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [mealPlan, setMealPlan] = useState<RateRule['plan']>('room_only');
  const [includeTax, setIncludeTax] = useState(false);

  useEffect(() => {
    refreshRules();
  }, []);

  const refreshRules = () => {
    const raw = getStoredRateRules();
    setRules(Object.values(raw).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  };

  const handleCreateRule = () => {
    if (!ruleName || !startDate || !endDate || !adjustmentValue) {
      toast("Please fill out all required fields.", "error");
      return;
    }

    addRateRule({
      property_id: '010', // Hardcoded to Peace Hotel for demo
      name: ruleName,
      room_type: roomType,
      plan: mealPlan,
      include_tax: includeTax,
      start_date: startDate,
      end_date: endDate,
      adjustment_type: adjustmentType,
      adjustment_value: parseFloat(adjustmentValue),
      days_of_week: [], // apply everyday for this simplified version
      is_active: true
    });

    toast("Pricing rule successfully created.", "success");
    setShowAddModal(false);
    setRuleName('');
    setAdjustmentValue('');
    setStartDate('');
    setEndDate('');
    refreshRules();
  };

  const handleDeleteRule = (id: string) => {
    deleteRateRule(id);
    toast("Pricing rule removed.", "info");
    refreshRules();
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 animate-slide-up bg-bg-canvas min-h-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display text-ink-primary tracking-tight">Rates & Inventory</h1>
          <p className="text-base text-ink-secondary">Manage dynamic pricing and seasonal adjustments.</p>
        </div>
        
        {canManageRates && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-accent shadow-md flex items-center justify-center gap-2 h-12 px-6 w-full sm:w-auto font-semibold"
          >
            <Plus size={18} />
            <span>Create Pricing Rule</span>
          </button>
        )}
      </header>

      {/* Base Rates Display */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-ink-primary font-display">Standard Base Rates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-border-subtle p-5 rounded-xl shadow-sm flex flex-col gap-2">
            <span className="text-[10px] uppercase font-semibold text-ink-muted tracking-wide">Default Single</span>
            <span className="text-2xl font-mono font-semibold text-ink-primary">₹1,500<span className="text-sm font-sans text-ink-muted font-normal">/nt</span></span>
          </div>
          <div className="bg-white border border-border-subtle p-5 rounded-xl shadow-sm flex flex-col gap-2">
            <span className="text-[10px] uppercase font-semibold text-ink-muted tracking-wide">Default Double</span>
            <span className="text-2xl font-mono font-semibold text-ink-primary">₹2,800<span className="text-sm font-sans text-ink-muted font-normal">/nt</span></span>
          </div>
          <div className="bg-white border border-border-subtle p-5 rounded-xl shadow-sm flex flex-col gap-2">
            <span className="text-[10px] uppercase font-semibold text-ink-muted tracking-wide">Default Dorm</span>
            <span className="text-2xl font-mono font-semibold text-ink-primary">₹800<span className="text-sm font-sans text-ink-muted font-normal">/bed</span></span>
          </div>
          {canManageRates && (
            <div className="bg-white border border-border-subtle p-5 rounded-xl shadow-sm flex flex-col justify-center items-center gap-2 border-dashed group cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
              <Plus size={24} className="text-ink-muted group-hover:text-accent transition-colors" />
              <span className="text-sm font-semibold text-ink-secondary group-hover:text-accent transition-colors">Add Room Type Rate</span>
            </div>
          )}
        </div>
      </section>

      {/* Active Rules List */}
      <section className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink-primary font-display">Dynamic Pricing Rules</h2>
          <span className="text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-wider">{rules.length} Active Rules</span>
        </div>

        {rules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rules.map(rule => (
              <div key={rule.id} className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 group">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-ink-primary">{rule.name}</h3>
                    <Badge type={rule.is_active ? 'success' : 'neutral'} label={rule.is_active ? 'Active' : 'Draft'} />
                  </div>
                  {canManageRates && (
                    <button 
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-ink-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3 bg-bg-sunken p-3 rounded-lg border border-border-subtle mt-2">
                   <div className={`p-2 rounded-full ${rule.adjustment_value > 0 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                     {rule.adjustment_value > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                   </div>
                   <div className="flex flex-col">
                     <span className="text-xs uppercase font-bold text-ink-muted tracking-wide">Adjustment</span>
                     <span className="font-mono font-bold text-lg">
                       {rule.adjustment_value > 0 ? '+' : ''}{rule.adjustment_value}{rule.adjustment_type === 'percentage' ? '%' : ' ₹'}
                     </span>
                   </div>
                </div>

                <div className="flex flex-col gap-2 mt-auto pt-2">
                  <div className="flex items-center gap-2 text-sm text-ink-secondary">
                    <Calendar size={14} className="text-ink-muted" />
                    <span className="font-mono">{format(new Date(rule.start_date), 'dd MMM')} - {format(new Date(rule.end_date), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] text-ink-muted font-semibold tracking-wider uppercase">{rule.room_type} rooms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-border-subtle border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3">
             <div className="w-16 h-16 bg-bg-sunken rounded-full flex items-center justify-center text-ink-muted mb-2">
                <Percent size={28} />
             </div>
             <h3 className="font-semibold text-ink-primary text-lg">No dynamic rules configured</h3>
             <p className="text-ink-secondary max-w-sm">Create pricing rules to automatically adjust rates during weekends, holidays, or seasonal events.</p>
             {canManageRates && (
               <button 
                  onClick={() => setShowAddModal(true)}
                  className="btn border border-border-strong text-ink-primary mt-4 font-semibold hover:bg-bg-sunken"
                >
                  Create First Rule
               </button>
             )}
          </div>
        )}
      </section>

      {/* Modal: Create Pricing Rule */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Pricing Rule"
        footer={
          <div className="flex gap-3 w-full">
            <button className="btn btn-ghost flex-1 font-semibold" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-accent flex-1 font-semibold" onClick={handleCreateRule}>Save Rule</button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
           <div className="field">
              <label className="label">Rule Name</label>
              <input 
                type="text" 
                className="input" 
                placeholder={ruleName ? "" : "e.g. Diwali Weekend Surge"}
                value={ruleName}
                onChange={e => setRuleName(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field">
                <label className="label">Start Date</label>
                <input 
                  type="date" 
                  className="input font-mono h-11" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">End Date</label>
                <input 
                  type="date" 
                  className="input font-mono h-11" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
           </div>

            <Select 
              options={[
                { id: 'all', label: 'All Room Types', icon: Layers, description: 'Universal Rule' },
                { id: 'single', label: 'Single Rooms', icon: Bed, description: 'Solo occupancy' },
                { id: 'double', label: 'Double Rooms', icon: Users, description: 'Duo / Couple occupancy' },
                { id: 'dormitory', label: 'Dormitory Beds', icon: Tent, description: 'Shared accommodation' }
              ]}
              value={roomType}
              onChange={(val) => setRoomType(val as any)}
              label="Applies To"
            />

           <div className="flex gap-4 items-end">
              <div className="field flex-1">
                <label className="label">Adjustment Type</label>
                <div className="flex bg-bg-sunken p-1 rounded-lg border border-border-subtle">
                  <button 
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${adjustmentType === 'percentage' ? 'bg-white shadow-sm text-ink-primary' : 'text-ink-muted hover:text-ink-primary'}`}
                    onClick={() => setAdjustmentType('percentage')}
                  >
                    Percentage (%)
                  </button>
                  <button 
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${adjustmentType === 'fixed' ? 'bg-white shadow-sm text-ink-primary' : 'text-ink-muted hover:text-ink-primary'}`}
                    onClick={() => setAdjustmentType('fixed')}
                  >
                    Fixed Amount (₹)
                  </button>
                </div>
              </div>
              <div className="field w-1/3">
                <label className="label">Value (+/-)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-ink-muted">
                    {adjustmentType === 'percentage' ? '%' : '₹'}
                  </span>
                  <input 
                    type="number" 
                    className="input pl-8 font-mono" 
                    placeholder={adjustmentValue ? "" : "e.g. 15 or -10"}
                    value={adjustmentValue}
                    onChange={e => setAdjustmentValue(e.target.value)}
                  />
                </div>
              </div>
           </div>
           
           <Badge type="info" label="Negative values decrease the price, positive values increase the price." />
        </div>
      </Modal>

    </div>
  );
}
