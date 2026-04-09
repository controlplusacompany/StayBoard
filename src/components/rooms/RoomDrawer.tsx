'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  X, Phone, Calendar, CreditCard, MessageSquare,
  ShieldCheck, Wallet, RefreshCw, Check, Ticket, 
  UserCheck, ArrowRight, Layout, Trash2, Sparkles, 
  Wrench, CircleCheck, Info, Clock, AlertTriangle,
  History, Plus, LogOut, ChevronDown
} from 'lucide-react';
import { Room, RoomStatus, Booking } from '@/types';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { formatINR, formatDate } from '@/lib/formatting';
import { updateRoomStatus, getBookingsForRoom, finalCheckout, shiftRoom, getVacantRooms } from '@/lib/store';
import { format, addDays, isSameDay, parseISO, eachDayOfInterval } from 'date-fns';

interface RoomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  room: (Room & { booking?: Booking }) | null;
}

export default function RoomDrawer({ isOpen, onClose, room }: RoomDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Modal States
  const [modalOpen, setModalOpen] = useState<'maintenance' | 'cancel' | 'checkout' | 'extend' | 'service' | 'shift' | null>(null);
  const [maintenanceNote, setMaintenanceNote] = useState('');
  const [staffNote, setStaffNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [extendDays, setExtendDays] = useState('1');
  const [serviceRequest, setServiceRequest] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [vacantRooms, setVacantRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (modalOpen === 'shift') {
      getVacantRooms(room!.property_id).then(setVacantRooms);
    }
  }, [modalOpen, room?.property_id]);
  
  // Checkout Revamp State
  const [checkoutPayAmount, setCheckoutPayAmount] = useState(0);

  useEffect(() => {
    if (modalOpen === 'checkout' && room?.booking) {
      const balance = (room.booking.total_amount || 0) - (room.booking.amount_paid || 0);
      setCheckoutPayAmount(Math.max(0, balance));
    }
  }, [modalOpen, room?.booking]);

  // Inline Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    guest_name: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
    total_amount: 0,
    amount_paid: 0
  });

  const [activeRequests, setActiveRequests] = useState<{id: number, text: string, time: string}[]>([]);
  const [newRequestInput, setNewRequestInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const commonRequestsList = [
    "Extra Towels",
    "Water Bottles",
    "Room Cleaning",
    "Blanket/Quilt",
    "Toiletries Kit",
    "Tea/Coffee Refill",
    "Morning Alarm",
    "Maintenance Issue"
  ];

  useEffect(() => {
    if (room) {
      setStaffNote(room.staff_notes || '');
      // Initialize with a dummy request if it's Room 03 and has no requests yet
      if (room.room_number === '03' && activeRequests.length === 0) {
        setActiveRequests([{ id: Date.now(), text: 'Extra Towels', time: '2m ago' }]);
      }
      if (room.booking) {
        setEditData({
          guest_name: room.booking.guest_name,
          guest_phone: room.booking.guest_phone,
          check_in_date: room.booking.check_in_date,
          check_out_date: room.booking.check_out_date,
          total_amount: room.booking.total_amount,
          amount_paid: room.booking.amount_paid
        });
        
        // Reset checkout states
        const initialBalance = room.booking.total_amount - room.booking.amount_paid;
        setCheckoutPayAmount(initialBalance > 0 ? initialBalance : 0);
      }
    }
  }, [room?.id, room?.booking, isOpen]);

  if (!room) return null;

  const handleStatusUpdate = (newStatus: RoomStatus, message: string) => {
    updateRoomStatus(room.id, newStatus);
    toast(message, 'success');
    onClose();
    // Simulate real-time update
    setTimeout(() => window.location.reload(), 500);
  };

  const handleCheckIn = () => {
    const hasBalance = room.booking && (room.booking.total_amount - room.booking.amount_paid > 0);
    if (hasBalance) {
      setModalOpen('checkout');
    } else {
      handleStatusUpdate('occupied', `Guest ${room.booking?.guest_name} checked in`);
    }
  };

  const handleMaintenanceConfirm = () => {
    handleStatusUpdate('maintenance', `Room ${room.room_number} marked for maintenance`);
    setModalOpen(null);
  };

  const handleCancelBooking = () => {
    handleStatusUpdate('vacant', `Booking for ${room.booking?.guest_name} cancelled`);
    setModalOpen(null);
  };

  const handleNoShow = () => {
    handleStatusUpdate('vacant', `Guest ${room.booking?.guest_name} marked as No-Show`);
    setModalOpen(null);
  };

  const saveStaffNote = () => {
    setIsSaving(true);
    // In real app: await updateStaffNotes(room.id, staffNote);
    setTimeout(() => {
      setIsSaving(false);
      toast("Note saved", "success");
    }, 400);
  };

  const handleAddRequest = (text?: string) => {
    const val = text || newRequestInput;
    if (!val.trim()) return;
    
    // Check if already exists to avoid duplicates
    if (activeRequests.some(r => r.text === val)) {
      toast(`${val} is already active`, "info");
      return;
    }

    const newReq = {
      id: Date.now(),
      text: val,
      time: 'Just now'
    };
    
    setActiveRequests([...activeRequests, newReq]);
    
    // Automatically log to housekeeping notes
    const updatedNote = staffNote 
      ? `${staffNote}\n[REQ ${format(new Date(), 'HH:mm')}] ${val}`
      : `[REQ ${format(new Date(), 'HH:mm')}] ${val}`;
    
    setStaffNote(updatedNote);
    if (!text) setNewRequestInput('');
    toast("Request added & logged", "success");
  };

  const handleResolveRequest = (id: number) => {
    setActiveRequests(activeRequests.filter(r => r.id !== id));
    toast("Request resolved", "success");
  };

  const renderStatusActions = () => {
    switch (room.status) {
      case 'vacant':
        return (
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setModalOpen('maintenance')}
              className="btn btn-secondary btn--full flex items-center justify-center gap-2"
            >
              <Wrench size={18} />
              <span>Mark Out of Order</span>
            </button>
          </div>
        );
      case 'arriving_today':
        return (
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleCheckIn}
              className="btn btn-accent btn--lg btn--full flex items-center justify-center gap-2"
            >
              <UserCheck size={18} />
              <span>Confirm Check-in</span>
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setModalOpen('cancel')} 
                className="btn btn-ghost text-danger border-danger/20 hover:bg-danger/5 py-3 h-auto"
              >
                Cancel
              </button>
              <button 
                onClick={handleNoShow}
                className="btn btn-ghost text-warning border-warning/20 hover:bg-warning/5 py-3 h-auto"
              >
                No-Show
              </button>
            </div>
            <button onClick={() => setModalOpen('maintenance')} className="btn btn-secondary py-3 h-auto">Mark Maintenance</button>
          </div>
        );
      case 'occupied':
      case 'checkout_today':
        return (
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => {
                const balance = room.booking ? room.booking.total_amount - room.booking.amount_paid : 0;
                if (balance > 0) toast(`Collect ${formatINR(balance)} balance first`, "warning");
                setModalOpen('checkout');
              }}
              className="btn btn-accent btn--lg btn--full flex items-center justify-center gap-2 py-5 shadow-lg shadow-accent/20"
            >
              <LogOut size={18} />
              <span className="text-[15px]">Confirm Checkout</span>
            </button>
            
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => setModalOpen('extend')} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border-subtle bg-white hover:bg-bg-sunken transition-all">
                <History size={16} className="text-ink-muted" />
                <span className="text-[9px] font-medium uppercase tracking-wider text-ink-secondary">Extend</span>
              </button>
              <button onClick={() => setIsEditing(true)} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border-subtle bg-white hover:bg-bg-sunken transition-all">
                <Layout size={16} className="text-ink-muted" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-secondary">Edit</span>
              </button>
              <button onClick={() => setModalOpen('shift')} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border-subtle bg-white hover:bg-bg-sunken transition-all group/shift">
                <RefreshCw size={16} className="text-ink-muted group-hover/shift:rotate-180 transition-all duration-500" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-secondary">Shift</span>
              </button>
              <button onClick={() => setModalOpen('maintenance')} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border-subtle bg-white hover:bg-bg-sunken transition-all">
                <Wrench size={16} className="text-ink-muted" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-secondary">Repair</span>
              </button>
            </div>
          </div>
        );
      case 'cleaning':
        return (
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => handleStatusUpdate('vacant', `Room ${room.room_number} is now ready`)}
              className="btn btn-accent btn--lg btn--full flex items-center justify-center gap-2"
            >
              <Check size={18} />
              <span>Mark Ready</span>
            </button>
            <button 
              onClick={() => setModalOpen('maintenance')}
              className="btn btn-secondary btn--full flex items-center justify-center gap-2"
            >
              <Wrench size={18} />
              <span>Report Issue</span>
            </button>
          </div>
        );
      case 'maintenance':
        return (
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => handleStatusUpdate('cleaning', `Room ${room.room_number} moved to cleaning`)}
              className="btn btn-accent btn--lg btn--full flex items-center justify-center gap-2"
            >
              <Check size={18} />
              <span>Mark Maintenance Done</span>
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSaveBooking = () => {
    setIsSaving(true);
    // In real app: await updateBooking(room.booking.id, editData);
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      toast("Booking updated", "success");
      // Simulate real-time update
      setTimeout(() => window.location.reload(), 500);
    }, 600);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[999] bg-overlay/60 backdrop-blur-[2px] transition-opacity duration-400 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 z-[1000] h-screen w-full max-w-[440px] bg-surface border-l border-border-subtle shadow-xl transition-transform duration-[450ms] ease-spring transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
      >
        {/* Header */}
        <header className="px-6 py-6 border-b border-border-subtle bg-white sticky top-0 z-10 flex flex-col gap-1.5">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                 <h2 className="text-[32px] font-display text-ink-primary leading-tight">Room {room.room_number}</h2>
                 <span className="text-[10px] font-medium text-ink-muted uppercase tracking-[0.1em]">{room.room_type}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge type={room.status} label={room.status.replace('_', ' ')} />
                <span className="text-xs text-ink-muted/80">• Floor {room.floor}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 -mr-1 text-ink-muted hover:text-ink-primary hover:bg-bg-sunken rounded-full transition-all">
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-10">
          
          {/* Guest Context */}
          {room.booking ? (
            <section className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-0.5">
                <h3 className="text-[10px] font-medium text-ink-muted uppercase tracking-[0.12em]">Current Guest</h3>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-[11px] text-accent hover:underline font-medium uppercase tracking-wider transition-all">Edit Details</button>
                )}
              </div>
              
              <div className={`bg-white rounded-2xl p-6 border transition-all duration-300 ${isEditing ? 'border-accent shadow-xl shadow-accent/10 ring-1 ring-accent/10' : 'border-border-subtle shadow-sm'} flex flex-col gap-6 relative overflow-hidden group`}>
                <div className="flex flex-col gap-5 relative z-10">
                  {isEditing ? (
                    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="field">
                        <label className="text-[9px] font-bold text-ink-muted uppercase tracking-[0.15em] block mb-1.5 ml-0.5">Guest Full Name</label>
                        <input 
                          type="text" 
                          className="w-full bg-bg-sunken border border-border-subtle rounded-xl px-4 py-3 text-lg font-sans font-medium text-ink-primary focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all"
                          placeholder="Enter guest name"
                          value={editData.guest_name}
                          onChange={(e) => setEditData({...editData, guest_name: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-5">
                        <div className="field">
                          <label className="text-[9px] font-semibold text-ink-muted uppercase tracking-[0.12em] block mb-1.5 ml-0.5">Contact Details</label>
                          <div className="relative group/phone">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-accent/5 flex items-center justify-center text-accent transition-colors group-focus-within/phone:bg-accent group-focus-within/phone:text-white">
                              <Phone size={14} />
                            </div>
                            <input 
                              type="text" 
                              className="w-full bg-bg-sunken border border-border-subtle rounded-xl pl-14 pr-4 py-3 text-sm font-sans font-medium text-ink-primary focus:bg-white focus:border-accent transition-all"
                              placeholder="+91 00000 00000"
                              value={editData.guest_phone}
                              onChange={(e) => setEditData({...editData, guest_phone: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col gap-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[9px] font-semibold text-ink-muted uppercase tracking-[0.12em]">Financial Balance</label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium text-ink-muted">Total:</span>
                            <span className="text-[10px] font-sans font-bold text-ink-primary tabular-nums tracking-tight">{formatINR(editData.total_amount)}</span>
                          </div>
                        </div>
                        <div className="bg-bg-sunken/50 border border-border-subtle rounded-2xl p-4 flex justify-between items-center gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-ink-muted uppercase font-semibold tracking-widest">Amount Paid</span>
                            <div className="relative">
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">₹</span>
                              <input 
                                  type="text"
                                  className="w-full bg-transparent border-none p-0 pl-3 text-lg font-sans font-bold text-success focus:ring-0 tabular-nums"
                                  value={editData.amount_paid === 0 ? '' : editData.amount_paid}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    const numVal = val === '' ? 0 : parseInt(val);
                                    setEditData({...editData, amount_paid: numVal});
                                  }}
                                  placeholder="0"
                                />
                            </div>
                          </div>
                          <div className="h-10 w-[1px] bg-border-subtle/50" />
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[9px] text-ink-muted uppercase font-medium tracking-widest text-right">Balance Due</span>
                            <span className={`text-xl font-sans font-medium tabular-nums tracking-tight ${editData.total_amount - editData.amount_paid > 0 ? 'text-danger' : 'text-success'}`}>
                              {formatINR(editData.total_amount - editData.amount_paid)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-3xl font-display text-ink-primary leading-tight">{room.booking.guest_name}</span>
                        <div className="flex items-center gap-2 text-sm font-sans text-ink-secondary">
                          <div className="w-6 h-6 rounded-full bg-accent/5 flex items-center justify-center text-accent">
                            <Phone size={12} strokeWidth={2.5} />
                          </div>
                          <span className="tabular-nums font-medium tracking-tight text-ink-primary/90">{room.booking.guest_phone}</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-2xl text-right min-w-[120px] shadow-inner ${room.booking.total_amount - room.booking.amount_paid > 0 ? 'bg-danger/5 border border-danger/10' : 'bg-success/5 border border-success/10'}`}>
                        <span className="text-[9px] text-ink-muted uppercase font-semibold tracking-[0.12em] block mb-1">Balance</span>
                        <span className={`text-2xl font-sans font-bold tabular-nums tracking-tight leading-none ${room.booking.total_amount - room.booking.amount_paid > 0 ? 'text-danger' : 'text-success'}`}>
                          {formatINR(room.booking.total_amount - room.booking.amount_paid)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={`grid grid-cols-2 gap-8 py-5 border-y border-border-subtle/40 relative z-10 transition-all ${isEditing ? 'mt-2 border-dashed' : ''}`}>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-ink-muted" />
                      <span className="text-[9px] text-ink-muted uppercase font-medium tracking-widest">Check In</span>
                    </div>
                    {isEditing ? (
                      <input 
                        type="date"
                        className="w-full bg-bg-sunken border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-ink-primary focus:bg-white focus:border-accent transition-all"
                        value={editData.check_in_date}
                        onChange={(e) => setEditData({...editData, check_in_date: e.target.value})}
                      />
                    ) : (
                      <span className="text-sm font-bold text-ink-primary">{formatDate(room.booking.check_in_date)}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-ink-muted" />
                      <span className="text-[9px] text-ink-muted uppercase font-medium tracking-widest">Check Out</span>
                    </div>
                    {isEditing ? (
                      <input 
                        type="date"
                        className="w-full bg-bg-sunken border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-ink-primary focus:bg-white focus:border-accent transition-all"
                        value={editData.check_out_date}
                        onChange={(e) => setEditData({...editData, check_out_date: e.target.value})}
                      />
                    ) : (
                      <span className="text-sm font-bold text-ink-primary">{formatDate(room.booking.check_out_date)}</span>
                    )}
                  </div>
                </div>

                {/* Bottom Save Action */}
                {isEditing && (
                  <div className="flex items-center gap-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <button 
                      onClick={() => setIsEditing(false)} 
                      disabled={isSaving}
                      className="flex-1 h-11 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm text-ink-secondary text-[11px] font-bold uppercase tracking-wider hover:bg-white hover:shadow-md transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveBooking}
                      disabled={isSaving}
                      className="flex-[2] h-11 rounded-full bg-gradient-to-b from-[#87B9FF] to-[#0259DD] text-white text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-accent/20 flex items-center justify-center gap-2 hover:translate-y-[-1px] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isSaving ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={14} />
                      )}
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="flex flex-col gap-6">
              <div className="py-10 border-2 border-dashed border-border-subtle rounded-3xl bg-sunken flex flex-col items-center justify-center text-center px-8 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-all duration-700" />
                <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent/40 mb-4 border border-accent/10 relative z-10 transition-transform group-hover:scale-110">
                  <Sparkles size={28} strokeWidth={1.5} />
                </div>
                <h4 className="text-lg font-display text-ink-primary mb-1 relative z-10">Room {room.room_number} is vacant</h4>
                <p className="text-sm text-ink-muted mb-6 relative z-10">Ready for immediate check-in or future booking.</p>
                <button 
                  onClick={() => router.push(`/booking/new?room=${room.room_number}&property=${room.property_id}`)}
                  className="btn btn-accent btn--sm flex items-center gap-2 group px-6 py-6 shadow-lg shadow-accent/20 relative z-10"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  <span>Start New Booking</span>
                </button>
              </div>
            </section>
          )}

          {/* Availability Timeline Section (Always Visible) */}
          <section className="flex flex-col gap-6">
            <h3 className="text-[10px] font-medium text-ink-muted uppercase tracking-[0.12em]">Availability</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-ink-primary">Room Availability</span>
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Next 30 Days</span>
              </div>
              
              <div className="flex gap-[2px] h-3 w-full bg-bg-sunken rounded-full overflow-hidden border border-border-subtle p-[1px]">
                {eachDayOfInterval({
                  start: new Date(),
                  end: addDays(new Date(), 29)
                }).map((date, i) => {
                  // Fallback for async timeline
                  const bookingLine = (room.bookings || [])
                    .filter(b => b.status === 'checked_in' || b.status === 'confirmed' || b.status === 'issued')
                    .find(b => {
                      const startDay = parseISO(b.check_in_date);
                      const endDay = parseISO(b.check_out_date);
                      return (isSameDay(date, startDay) || (date > startDay && date < endDay));
                    });
                  return (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-[1px] ${bookingLine ? 'bg-accent' : 'bg-green-500/20'}`}
                      title={bookingLine ? `Booked: ${bookingLine.guest_name}` : `Vacant: ${format(date, 'dd MMM')}`}
                    />
                  );
                })}
              </div>
              
              {(() => {
                const nextBookingLine = (room.bookings || [])
                  .filter(b => (b.status === 'confirmed' || b.status === 'issued') && parseISO(b.check_in_date) > new Date())
                  .sort((a, b) => parseISO(a.check_in_date).getTime() - parseISO(b.check_in_date).getTime())[0];
                
                if (nextBookingLine) {
                  return (
                    <div className="flex items-center gap-2 px-3 py-2 bg-accent/5 rounded-lg border border-accent/10">
                      <Info size={12} className="text-accent" />
                      <p className="text-[11px] font-medium text-ink-secondary">
                        Next booking: <span className="font-bold">{format(parseISO(nextBookingLine.check_in_date), 'd MMM')}</span> ({nextBookingLine.guest_name})
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-500/5 rounded-lg border border-green-500/10">
                    <Check size={12} className="text-green-600" />
                    <p className="text-[11px] font-medium text-ink-secondary">Available for the next 30 days</p>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Service & Requests */}
          <div className="space-y-8">
            <section className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em]">Active Requests</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${activeRequests.length > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                  {activeRequests.length} {activeRequests.length === 1 ? 'Alert' : 'Alerts'}
                </span>
              </div>
              
              <div className="space-y-3">
                {activeRequests.map((req) => (
                  <div key={req.id} className="bg-white border border-border-subtle rounded-xl p-4 flex justify-between items-center shadow-xs animate-in slide-in-from-right-2 duration-300">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-ink-primary">{req.text}</span>
                      <span className="text-[10px] text-ink-muted font-bold uppercase tracking-tight">Requested by Guest • {req.time}</span>
                    </div>
                    <button 
                      className="btn btn-accent h-7 px-3 text-[10px] font-bold uppercase tracking-wider" 
                      onClick={() => handleResolveRequest(req.id)}
                    >
                      Resolve
                    </button>
                  </div>
                ))}

                {/* Request Input Area */}
                <div className="flex flex-col gap-2 mt-4 relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        className="w-full bg-bg-sunken border border-border-subtle rounded-xl pl-4 pr-10 py-3 text-xs font-medium text-ink-primary focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all"
                        placeholder="Add special request..."
                        value={newRequestInput}
                        onChange={(e) => setNewRequestInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddRequest()}
                      />
                      <button 
                        onClick={() => handleAddRequest()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-accent hover:bg-accent/10 transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`px-4 rounded-xl border flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all ${isDropdownOpen ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 'bg-white border-border-subtle text-ink-secondary hover:bg-bg-sunken'}`}
                    >
                      Common Items
                      <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Common Items Multi-Select Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute top-[calc(100%+8px)] right-0 left-0 z-20 bg-white border border-border-subtle rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="grid grid-cols-1 gap-1 max-h-[240px] overflow-y-auto custom-scrollbar">
                        {commonRequestsList.map((item) => {
                          const isSelected = activeRequests.some(r => r.text === item);
                          return (
                            <button
                              key={item}
                              onClick={() => {
                                if (!isSelected) {
                                  handleAddRequest(item);
                                } else {
                                  handleResolveRequest(activeRequests.find(r => r.text === item)?.id || 0);
                                }
                              }}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${isSelected ? 'bg-accent/5 text-accent' : 'hover:bg-bg-sunken text-ink-secondary'}`}
                            >
                              <span className="text-xs font-medium">{item}</span>
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-accent border-accent text-white scale-110 shadow-sm' : 'border-border-subtle bg-white'}`}>
                                {isSelected && <Check size={12} strokeWidth={3} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 pt-2 border-t border-border-subtle/40 px-2 flex justify-between items-center">
                        <span className="text-[9px] text-ink-muted uppercase font-bold tracking-widest pl-2">Select to add</span>
                        <button 
                          onClick={() => setIsDropdownOpen(false)}
                          className="text-[10px] font-bold text-accent px-3 py-1.5 hover:bg-accent/5 rounded-lg transition-all"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em]">Internal Housekeeping Notes</h3>
              <div className="relative group">
                <textarea 
                  className="input min-h-[120px] text-sm py-4 px-5 bg-bg-sunken border-dashed focus:border-solid focus:bg-white transition-all rounded-2xl resize-none"
                  placeholder={staffNote ? "" : "Notes for the staff on duty..."}
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  onBlur={saveStaffNote}
                />
                <div className={`absolute right-4 bottom-4 text-[10px] font-bold uppercase tracking-widest transition-opacity duration-300 ${isSaving ? 'text-accent opacity-100' : 'opacity-0'}`}>
                  {isSaving ? 'Syncing...' : 'Saved'}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-border-subtle bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.04)] relative z-10">
          {renderStatusActions()}
        </footer>
      </div>

      {/* MODAL: Maintenance Note */}
      <Modal
        isOpen={modalOpen === 'maintenance'}
        onClose={() => setModalOpen(null)}
        title="Maintenance Note"
        footer={
          <>
            <button className="btn btn-secondary px-8" onClick={() => setModalOpen(null)}>Cancel</button>
            <button className="btn btn-accent px-8 shadow-lg" onClick={handleMaintenanceConfirm}>Mark Out-of-Order</button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">Describe the issue and required maintenance for Room {room.room_number}.</p>
          <textarea 
            className="input min-h-[120px]" 
            placeholder={maintenanceNote ? "" : "e.g. AC not cooling, requires technician visit."}
            value={maintenanceNote}
            onChange={(e) => setMaintenanceNote(e.target.value)}
          />
        </div>
      </Modal>

      {/* MODAL: Cancel Booking */}
      <Modal
        isOpen={modalOpen === 'cancel'}
        onClose={() => setModalOpen(null)}
        title="Cancel Booking?"
        className="max-w-[400px]"
      >
        <div className="flex flex-col items-center text-center gap-5 py-2">
          <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center text-danger">
            <AlertTriangle size={28} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-display text-ink-primary">Cancel {room.booking?.guest_name}'s Booking?</h3>
            <p className="text-sm text-ink-muted">This will release the room immediately. This action cannot be undone.</p>
          </div>
          <div className="flex flex-col w-full gap-3 mt-4">
            <button 
              onClick={handleCancelBooking}
              className="btn btn-accent bg-danger border-danger hover:bg-danger/90 rounded-full w-full py-4 shadow-lg shadow-danger/20"
            >
              Confirm Cancellation
            </button>
            <button className="btn btn-secondary w-full py-4" onClick={() => setModalOpen(null)}>Go Back</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalOpen === 'checkout'}
        onClose={() => setModalOpen(null)}
        title="Checkout & Payment"
        className="max-w-[440px]"
      >
        <div className="flex flex-col gap-6 py-2">
          {/* Billing Summary          <div className="bg-bg-sunken/50 rounded-2xl p-5 border border-border-subtle flex flex-col gap-4">
             <div className="flex justify-between items-center text-xs font-medium text-ink-muted">
                <span>Room Charges Total</span>
                <span className="font-sans font-semibold text-ink-primary">{formatINR(room.booking?.total_amount || 0)}</span>
             </div>
             <div className="flex justify-between items-center text-xs font-medium text-ink-muted">
                <span>Previously Paid</span>
                <span className="font-sans font-semibold text-success">-{formatINR(room.booking?.amount_paid || 0)}</span>
             </div>
             <div className="h-[1px] bg-border-subtle/40 border-dashed border-t" />
             <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-ink-primary">Outstanding Balance</span>
                <span className="text-lg font-sans font-bold text-danger tabular-nums">
                   {formatINR(Math.max(0, (room.booking?.total_amount || 0) - (room.booking?.amount_paid || 0)))}
                </span>
             </div>
          </div>

          {/* Simplified Payment Section */}
          <div className="flex flex-col gap-5">
             <div className="field">
                <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-widest block mb-2 ml-1">Collecting Now</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted">₹</span>
                   <input 
                      type="text"
                      className="w-full bg-white border border-border-subtle rounded-xl pl-8 pr-4 py-3 text-sm font-sans font-semibold text-success focus:border-accent transition-all animate-pulse-subtle"
                      value={checkoutPayAmount === 0 ? '' : checkoutPayAmount}
                      onChange={(e) => {
                         const val = e.target.value.replace(/[^0-9]/g, '');
                         setCheckoutPayAmount(val === '' ? 0 : parseInt(val));
                      }}
                      placeholder={((room.booking?.total_amount || 0) - (room.booking?.amount_paid || 0)).toString()}
                   />
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={async () => {
                if (room.booking) {
                  try {
                    await finalCheckout(room.booking.id, checkoutPayAmount);
                    toast(`Payment of ${formatINR(checkoutPayAmount)} recorded & Checkout completed`, "success");
                    setModalOpen(null);
                    onClose();
                  } catch (e) {
                    toast("Checkout failed", "error");
                  }
                }
              }}
              className="btn btn-accent btn--lg py-5 shadow-lg shadow-accent/20 text-[15px] font-bold"
            >
              Complete Checkout & Settle Account
            </button>
            <button className="btn btn-ghost py-3" onClick={() => setModalOpen(null)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Extend Stay */}
      <Modal
        isOpen={modalOpen === 'extend'}
        onClose={() => setModalOpen(null)}
        title="Extend Stay"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(null)}>Cancel</button>
            <button 
              className="btn btn-accent px-8" 
              onClick={() => {
                toast(`Stay extended by ${extendDays} days`, "success");
                setModalOpen(null);
                setTimeout(() => window.location.reload(), 500);
              }}
            >
              Confirm Extension
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="field">
            <label className="label">Extend by (Days)</label>
            <input 
              type="number" 
              min="1" 
              className="input" 
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
            />
          </div>
          <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink-muted">New Checkout Date</span>
              <span className="font-bold text-accent">
                {room.booking && formatDate(new Date(new Date(room.booking.check_out_date).getTime() + parseInt(extendDays || '0') * 86400000).toISOString())}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-ink-muted">Additional Charges</span>
              <span className="font-mono font-bold">{formatINR(parseInt(extendDays || '0') * 1500)}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: New Service Request */}
      <Modal
        isOpen={modalOpen === 'service'}
        onClose={() => setModalOpen(null)}
        title="New Service Request"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(null)}>Cancel</button>
            <button 
              className="btn btn-accent px-8" 
              onClick={() => {
                toast("Service request created", "success");
                setModalOpen(null);
              }}
            >
              Create Request
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="field">
            <label className="label">Request Details</label>
            <textarea 
              className="input min-h-[100px]" 
              placeholder={serviceRequest ? "" : "e.g. Extra pillows, AC remote battery change..."}
              value={serviceRequest}
              onChange={(e) => setServiceRequest(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['Housekeeping', 'Maintenance', 'Kitchen', 'Reception'].map(dept => (
              <button 
                key={dept}
                className="btn btn-outline py-2 text-xs font-bold"
                onClick={() => setServiceRequest(`${dept}: `)}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* MODAL: Shift Room */}
      <Modal
        isOpen={modalOpen === 'shift'}
        onClose={() => setModalOpen(null)}
        title="Shift Guest to New Room"
        className="max-w-[480px]"
      >
        <div className="flex flex-col gap-6 py-2">
           <div className="flex flex-col gap-1">
             <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest leading-none">Shifting From</span>
             <h4 className="text-xl font-display text-ink-primary">Room {room.room_number} ({room.booking?.guest_name || 'Guest'})</h4>
           </div>

           <div className="flex flex-col gap-4">
             <div className="flex justify-between items-center px-1">
               <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Select Target Room</span>
               <span className="text-[10px] text-accent font-bold uppercase">{vacantRooms.length} Vacant Rooms</span>
             </div>
             
             <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
               {vacantRooms.map(vRoom => (
                 <button 
                   key={vRoom.id}
                   onClick={() => {
                     if (room.booking) {
                       shiftRoom(room.booking.id, room.id, vRoom.id);
                       toast(`${room.booking.guest_name} shifted from ${room.room_number} to ${vRoom.room_number}`, "success");
                       setModalOpen(null);
                       onClose();
                       // Global refresh to ensure state consistency
                       setTimeout(() => window.location.reload(), 600);
                     }
                   }}
                   className="flex items-center justify-between p-4 rounded-2xl border border-border-subtle bg-white hover:bg-bg-sunken hover:border-accent group transition-all"
                 >
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-success/5 border border-success/10 flex items-center justify-center text-success font-bold font-sans">
                       {vRoom.room_number}
                     </div>
                     <div className="flex flex-col text-left">
                       <span className="text-sm font-bold text-ink-primary">{vRoom.room_type}</span>
                        <span className="text-[10px] text-ink-muted font-medium">Floor {vRoom.floor} • Max {vRoom.max_occupancy} Guests</span>
                     </div>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-ink-primary">₹{vRoom.base_price}/nt</span>
                      <ArrowRight size={14} className="text-ink-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                   </div>
                 </button>
               ))}
               
               {vacantRooms.length === 0 && (
                 <div className="p-8 border-2 border-dashed border-border-subtle rounded-2xl flex flex-col items-center justify-center text-center">
                    <AlertTriangle size={24} className="text-ink-muted mb-2" />
                    <p className="text-xs text-ink-muted font-medium uppercase tracking-tight">No vacant rooms available to shift</p>
                 </div>
               )}
             </div>
           </div>

           <div className="p-4 bg-warning/5 border border-warning/10 rounded-2xl flex items-start gap-3">
             <Info size={16} className="text-warning mt-0.5 flex-shrink-0" />
             <p className="text-[11px] text-ink-secondary leading-relaxed font-medium">
               Shifting a room will move all guest details and payments. The old room ({room.room_number}) will automatically be marked for cleaning.
             </p>
           </div>
        </div>
      </Modal>
    </>
  );
}
