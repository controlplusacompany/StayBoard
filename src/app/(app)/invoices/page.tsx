'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  FileText, 
  Download, 
  CreditCard,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  CheckCircle,
  AlertTriangle,
  Zap,
  Smartphone,
  Wallet,
  MousePointer2
} from 'lucide-react';
import Select from '@/components/ui/Select';
import { 
  getStoredInvoices,
  getStoredBookings,
  processPayment,
  getSelectedProperty
} from '@/lib/store';
import { Invoice, Booking, PaymentMethod, InvoiceStatus } from '@/types';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';
import { useRealtime } from '@/hooks/useRealtime';

export default function InvoicesPage({ isHub = false }: { isHub?: boolean }) {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadData = useCallback(async () => {
    const currentProperty = getSelectedProperty();
    setPropertyFilter(currentProperty);

    const rawInvoices = await getStoredInvoices();
    const rawBookings = await getStoredBookings();
    setInvoices(rawInvoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setBookings(rawBookings);
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Supabase Realtime Sync
  useRealtime(loadData, ['invoices', 'bookings']);

  const handleDownloadInvoice = (invoice: Invoice) => {
    toast(`Preparing ${invoice.invoice_number} download...`, "success");
    
    // Create simple receipt content
    const booking = bookings[invoice.booking_id];
    const content = `
      STAYBOARD - INVOICE
      -------------------
      Invoice: ${invoice.invoice_number}
      Guest: ${booking?.guest_name || 'Guest'}
      Date: ${format(new Date(invoice.created_at), 'dd MMM yyyy')}
      Total: ₹${invoice.amount_total}
      Paid: ₹${invoice.amount_paid}
      Balance: ₹${invoice.amount_total - invoice.amount_paid}
      Status: ${invoice.status.toUpperCase()}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${invoice.invoice_number}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      toast(`${invoice.invoice_number} downloaded successfully!`, "success");
    }, 1000);
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast("Please enter a valid amount", "error");
      return;
    }

    const remaining = selectedInvoice.amount_total - selectedInvoice.amount_paid;
    if (amount > remaining) {
      toast(`Amount cannot exceed remaining balance (₹${remaining})`, "error");
      return;
    }

    await processPayment(selectedInvoice.id, amount, paymentMethod);
    
    toast(`Payment of ₹${amount} recorded via ${paymentMethod.toUpperCase()}`, "success");
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentAmount('');
  };

  const filteredInvoices = invoices.filter(inv => {
    // 1. Property Filter
    if (propertyFilter && inv.property_id !== propertyFilter) return false;

    // 2. Search & Status
    const booking = bookings[inv.booking_id];
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking && booking.guest_name.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return <CheckCircle2 size={16} className="text-success" />;
      case 'partially_paid': return <AdjustmentsIcon />;
      case 'issued': return <Clock size={16} className="text-warning" />;
      case 'void': return <AlertCircle size={16} className="text-danger" />;
      default: return <FileText size={16} className="text-ink-muted" />;
    }
  };
  
  const AdjustmentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-info"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;

  if (!dataLoaded) return (
    <div className={isHub ? "p-6 animate-pulse" : "p-6 md:p-10 flex flex-col gap-6 animate-pulse bg-bg-canvas min-h-full"}>
      <div className="flex flex-col gap-3">
        <div className="h-3 w-32 bg-bg-sunken rounded" />
        <div className="h-10 w-64 bg-bg-sunken rounded" />
      </div>
      <div className="h-14 bg-bg-sunken rounded-xl" />
      <div className="h-64 bg-bg-sunken rounded-xl" />
    </div>
  );

  return (
    <div className={isHub ? "p-0 flex flex-col gap-8 animate-slide-up" : "p-6 md:p-10 flex flex-col gap-8 animate-slide-up bg-bg-canvas min-h-full"}>
      {!isHub && (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-medium text-accent uppercase tracking-[0.3em] font-sans">Billing & Ledger</span>
            <h1 className="text-4xl md:text-5xl font-display text-ink-primary tracking-tighter font-medium text-balance">Invoices & Payments</h1>
          </div>
        </header>
      )}

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-border-subtle shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input 
              type="text" 
              className="input pl-12" 
              placeholder={searchQuery ? "" : "Search invoice or guest..."} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select 
            options={[
              { id: 'all', label: 'All Statuses', icon: Filter },
              { id: 'issued', label: 'Unpaid / Issued', icon: Clock, description: 'Awaiting' },
              { id: 'partially_paid', label: 'Partially Paid', icon: Clock, description: 'Some balance' },
              { id: 'paid', label: 'Fully Paid', icon: CheckCircle2, description: 'Cleared' },
              { id: 'void', label: 'Void', icon: AlertCircle, description: 'Cancelled' }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            className="md:w-56"
          />
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white border border-border-subtle rounded-xl shadow-sm overflow-hidden auto-rows-max">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-sunken/50">
                <th className="py-4 px-6 text-[10px] font-medium text-ink-muted uppercase tracking-[0.1em]">Invoice / Guest</th>
                <th className="py-4 px-6 text-[10px] font-medium text-ink-muted uppercase tracking-[0.1em]">Date</th>
                <th className="py-4 px-6 text-[10px] font-medium text-ink-muted uppercase tracking-[0.1em]">Amount</th>
                <th className="py-4 px-6 text-[10px] font-medium text-ink-muted uppercase tracking-[0.1em]">Status</th>
                <th className="py-4 px-6 text-[10px] font-medium text-ink-muted uppercase tracking-[0.1em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, index) => {
                const booking = bookings[invoice.booking_id];
                const balance = invoice.amount_total - invoice.amount_paid;
                
                return (
                  <tr key={invoice.id} className="border-b border-border-subtle/50 hover:bg-bg-sunken/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-mono font-medium text-ink-primary tracking-tight">{invoice.invoice_number}</span>
                        <span className="text-[13px] text-ink-secondary font-normal">{booking?.guest_name || 'Unknown Guest'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-ink-primary">{format(new Date(invoice.created_at), 'dd MMM yyyy')}</span>
                        <span className="text-xs text-ink-muted">Due: {format(new Date(invoice.due_date), 'dd MMM yyyy')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-mono font-medium text-ink-primary">₹{invoice.amount_total}</span>
                        {balance > 0 ? (
                           <span className="text-[11px] font-mono text-warning font-medium">Balance: ₹{balance}</span>
                        ) : (
                           <span className="text-[11px] font-mono text-success font-medium">Paid in full</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status)}
                        <Badge type={invoice.status === 'issued' ? 'warning' : invoice.status === 'partially_paid' ? 'info' : invoice.status} label={invoice.status.replace('_', ' ')} />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {balance > 0 && invoice.status !== 'void' && (
                          <button 
                            className="bg-accent/10 hover:bg-accent hover:text-white text-accent px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setPaymentAmount(balance.toString());
                              setShowPaymentModal(true);
                            }}
                          >
                            Add Payment
                          </button>
                        )}
                        <button 
                          className="p-2 text-ink-muted hover:text-ink-primary hover:bg-bg-sunken rounded-lg transition-colors" 
                          title="Download Print PDF"
                          onClick={() => handleDownloadInvoice(invoice)}
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-muted">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FileText size={32} className="opacity-20" />
                      <p>No invoices found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Payment */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        footer={
          <div className="flex gap-3 w-full">
            <button className="btn btn-ghost flex-1" onClick={() => setShowPaymentModal(false)}>Cancel</button>
            <button className="btn btn-accent flex-1" onClick={handleRecordPayment}>Confirm Payment</button>
          </div>
        }
      >
        {selectedInvoice && (
          <div className="flex flex-col gap-6">
            <div className="bg-bg-sunken p-4 rounded-xl border border-border-subtle flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-xs text-ink-muted font-medium uppercase tracking-wider">Invoice Number</span>
                <span className="font-mono font-medium text-ink-primary">{selectedInvoice.invoice_number}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs text-ink-muted font-medium uppercase tracking-wider">Remaining Balance</span>
                <span className="font-mono font-medium text-warning text-lg">₹{selectedInvoice.amount_total - selectedInvoice.amount_paid}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field">
                <label className="label">Amount to Pay</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-ink-muted">₹</span>
                  <input 
                    type="number" 
                    className="input pl-8 font-mono" 
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    max={selectedInvoice.amount_total - selectedInvoice.amount_paid}
                  />
                </div>
              </div>
              
                <Select 
                  options={[
                    { id: 'upi', label: 'UPI / QR', icon: Smartphone, description: 'Instant' },
                    { id: 'cash', label: 'Cash', icon: Wallet, description: 'In-hand' },
                    { id: 'card', label: 'Card / POS', icon: CreditCard, description: 'Terminal' },
                    { id: 'online', label: 'Online', icon: MousePointer2, description: 'Bank Trans.' }
                  ]}
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val as PaymentMethod)}
                  label="Payment Method"
                />
            </div>
            
            <Badge type="info" label="A receipt will be automatically generated upon payment." />
          </div>
        )}
      </Modal>

    </div>
  );
}
