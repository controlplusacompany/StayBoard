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
import { updateRoomStatus, getBookingsForRoom, finalCheckout, shiftRoom, getVacantRooms, updateBookingStatus, updateBooking } from '@/lib/store';
import { format, addDays, isSameDay, parseISO, eachDayOfInterval, differenceInDays } from 'date-fns';

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [extensionData, setExtensionData] = useState({
    newCheckoutDate: '',
    extraCharges: 0,
    days: 0
  });
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
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [checkoutNote, setCheckoutNote] = useState('');

  useEffect(() => {
    if (modalOpen === 'checkout' && room?.booking) {
      const balance = (room.booking.total_amount || 0) - (room.booking.amount_paid || 0);
      setCheckoutPayAmount(Math.max(0, balance));
      setCheckoutNote(''); // Reset remarks
      setPaymentMode('UPI'); // Default
    }
  }, [modalOpen, room?.booking]);
  useEffect(() => {
    if (modalOpen === 'extend' && room?.booking) {
      const currentEnd = parseISO(room.booking.check_out_date);
      const nextDay = addDays(currentEnd, 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      
      setExtensionData({
        newCheckoutDate: nextDayStr,
        extraCharges: Number(room.base_price) || 1500,
        days: 1
      });
    }
  }, [modalOpen, room?.booking, room?.base_price]);

  // Inline Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    guest_name: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
    total_amount: 0,
    amount_paid: 0,
    collect_now: 0
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
          amount_paid: room.booking.amount_paid,
          collect_now: 0
        });
        
        // Reset checkout states
        const initialBalance = room.booking.total_amount - room.booking.amount_paid;
        setCheckoutPayAmount(initialBalance > 0 ? initialBalance : 0);
      }
      if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('stayboard_user_role'));
      }
    }
  }, [room?.id, room?.booking, isOpen]);

  if (!room) return null;

  const handleStatusUpdate = async (newStatus: RoomStatus, message: string) => {
    await updateRoomStatus(room.id, newStatus);
    toast(message, 'success');
    onClose();
  };

  const handleCheckIn = async () => {
    const hasBalance = room.booking && (room.booking.total_amount - room.booking.amount_paid > 0);
    if (hasBalance) {
      setModalOpen('checkout');
    } else if (room.booking) {
      await updateBookingStatus(room.booking.id, 'checked_in');
      toast(`Guest ${room.booking.guest_name} checked in`, 'success');
      onClose();
      // Simulate real-time update
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
              <button onClick={() => setModalOpen('extend')} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-full border border-border-subtle bg-white hover:bg-bg-sunken transition-all">
                <History size={16} className="text-ink-muted" />
                <span className="text-[10px] font-medium tracking-tight text-ink-secondary">Extend</span>
              </button>
              <button onClick={() => setIsEditing(true)} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-full border border-border-subtle bg-white hover:bg-bg-sunken transition-all">
                <Layout size={16} className="text-ink-muted" />
                <span className="text-[10px] font-semibold tracking-tight text-ink-secondary">Edit</span>
              </button>
              <button onClick={() => setModalOpen('shift')} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-full border border-border-subtle bg-white hover:bg-bg-sunken transition-all group/shift">
                <RefreshCw size={16} className="text-ink-muted group-hover/shift:rotate-180 transition-all duration-500" />
                <span className="text-[10px] font-semibold tracking-tight text-ink-secondary">Shift</span>
              </button>
              <button onClick={() => setModalOpen('maintenance')} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-full border border-border-subtle bg-white hover:bg-bg-sunken transition-all">
                <Wrench size={16} className="text-ink-muted" />
                <span className="text-[10px] font-semibold tracking-tight text-ink-secondary">Repair</span>
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

  const isReception = userRole === 'reception';

  const handleSaveBooking = async () => {
    if (!room?.booking?.id) return;
    setIsSaving(true);
    
    try {
      // Calculate final amount paid based on collect_now addition
      const finalAmountPaid = (Number(editData.amount_paid) || 0) + (Number(editData.collect_now) || 0);
      
      // Clean up the data for Supabase update
      const { collect_now, ...dbUpdates } = editData;
      
      const updatedData = {
        ...dbUpdates,
        amount_paid: finalAmountPaid
      };

      await updateBooking(room.booking.id, updatedData as Partial<Booking>);
      
      setIsSaving(false);
      setIsEditing(false);
      toast("Booking updated successfully", "success");
      
      // The store broadcast will trigger refreshData in the parent
    } catch (error) {
      console.error("Failed to save booking:", error);
      toast("Failed to update booking", "error");
      setIsSaving(false);
    }
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
                 <h2 className="text-[32px] font-display font-semibold text-ink-primary leading-tight">Room {room.room_number}</h2>
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
                  <button onClick={() => setIsEditing(true)} className="text-[12px] text-accent hover:underline font-medium transition-all">Edit details</button>
                )}
              </div>
              
              <div className={`bg-white rounded-2xl p-6 border transition-all duration-300 ${isEditing ? 'border-accent shadow-xl shadow-accent/10 ring-1 ring-accent/10' : 'border-border-subtle shadow-sm'} flex flex-col gap-6 relative overflow-hidden group`}>
                <div className="flex flex-col gap-5 relative z-10">
                  {isEditing ? (
                    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="field">
                        <label className="text-[9px] font-semibold text-ink-muted uppercase tracking-[0.15em] block mb-1.5 ml-0.5">Guest Full Name</label>
                        <input 
                          type="text" 
                          className="w-full bg-bg-sunken border border-border-subtle rounded-xl px-4 py-3 text-lg font-sans font-semibold text-ink-primary focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all"
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

                        <div className="pt-2 flex flex-col gap-4">
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em]">Payment Summary</label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium text-ink-muted">Total Bill:</span>
                              <input 
                                type="text"
                                className="w-20 bg-bg-sunken border border-border-subtle rounded-lg px-2 py-1 text-[10px] font-sans font-bold text-ink-primary tabular-nums text-right outline-none focus:border-accent"
                                value={editData.total_amount}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  setEditData({...editData, total_amount: val === '' ? 0 : parseInt(val)});
                                }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-bg-sunken/50 border border-border-subtle rounded-2xl p-4 flex flex-col gap-1.5 opacity-80">
                              <span className="text-[9px] text-ink-muted uppercase font-bold tracking-widest leading-none">Previously Paid</span>
                              <span className="text-sm font-sans font-bold text-ink-secondary tabular-nums">
                                {formatINR(editData.amount_paid)}
                              </span>
                            </div>

                            <div className="bg-white border-2 border-accent/20 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm">
                              <span className="text-[9px] text-accent uppercase font-bold tracking-widest leading-none">Collect Now</span>
                              <div className="relative">
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-bold text-accent">₹</span>
                                <input 
                                    type="text"
                                    autofocus
                                    className="w-full bg-transparent border-none p-0 pl-3 text-lg font-sans font-black text-accent focus:ring-0 tabular-nums"
                                    value={editData.collect_now === 0 ? '' : editData.collect_now}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^0-9]/g, '');
                                      const numVal = val === '' ? 0 : parseInt(val);
                                      setEditData({...editData, collect_now: numVal});
                                    }}
                                    placeholder="0"
                                  />
                              </div>
                            </div>
                          </div>

                          <div className="bg-bg-sunken border border-border-subtle rounded-2xl p-4 flex justify-between items-center">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-ink-muted uppercase font-bold tracking-widest">Resulting Balance</span>
                              <p className="text-[10px] text-ink-muted font-medium italic">Calculated after payment</p>
                            </div>
                            <span className={`text-xl font-sans font-black tabular-nums tracking-tighter ${editData.total_amount - (editData.amount_paid + editData.collect_now) > 0 ? 'text-danger' : 'text-success'}`}>
                              {formatINR(editData.total_amount - (editData.amount_paid + editData.collect_now))}
                            </span>
                          </div>
                        </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-3xl font-display font-semibold text-ink-primary leading-tight">{room.booking.guest_name}</span>
                          <div className="flex items-center gap-2 text-sm font-sans text-ink-secondary">
                            <div className="w-6 h-6 rounded-full bg-accent/5 flex items-center justify-center text-accent">
                              <Phone size={12} strokeWidth={2.5} />
                            </div>
                            <span className="tabular-nums font-medium tracking-tight text-ink-primary/90">{room.booking.guest_phone}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] text-ink-muted uppercase font-bold tracking-[0.15em] leading-none mb-1">Total Payment</span>
                          <span className="text-2xl font-sans font-black text-ink-primary tracking-tighter tabular-nums leading-none">
                            {formatINR(room.booking.total_amount)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-success/5 border border-success/10 rounded-2xl p-4 flex flex-col gap-1">
                          <span className="text-[9px] text-success uppercase font-black tracking-widest leading-none">Paid Amount</span>
                          <span className="text-lg font-sans font-bold text-success-600 tabular-nums">
                            {formatINR(room.booking.amount_paid)}
                          </span>
                        </div>
                        <div className={`rounded-2xl p-4 flex flex-col gap-1 border ${room.booking.total_amount - room.booking.amount_paid > 0 ? 'bg-danger/5 border-danger/10 shadow-[inner_0_2px_4px_rgba(239,68,68,0.02)]' : 'bg-success/5 border-success/10'}`}>
                          <span className={`text-[9px] uppercase font-black tracking-widest leading-none ${room.booking.total_amount - room.booking.amount_paid > 0 ? 'text-danger' : 'text-success'}`}>
                            {room.booking.total_amount - room.booking.amount_paid > 0 ? 'Pending Due' : 'Fully Paid'}
                          </span>
                          <span className={`text-lg font-sans font-bold tabular-nums ${room.booking.total_amount - room.booking.amount_paid > 0 ? 'text-danger' : 'text-success'}`}>
                            {formatINR(room.booking.total_amount - room.booking.amount_paid)}
                          </span>
                        </div>
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
                      <span className="text-sm font-semibold text-ink-primary">{formatDate(room.booking.check_in_date)}</span>
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
                      <span className="text-sm font-semibold text-ink-primary">{formatDate(room.booking.check_out_date)}</span>
                    )}
                  </div>
                </div>

                {/* Bottom Save Action */}
                {isEditing && (
                  <div className="flex items-center gap-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <button 
                      onClick={() => setIsEditing(false)} 
                      disabled={isSaving}
                      className="flex-1 h-11 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm text-ink-secondary text-[13px] font-semibold hover:bg-white hover:shadow-md transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveBooking}
                      disabled={isSaving}
                      className="btn btn-accent flex-[2] flex items-center justify-center gap-2 disabled:opacity-50"
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
                  className="btn btn-accent flex items-center gap-2 group shadow-lg shadow-accent/20 relative z-10"
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
                <span className="text-xs font-semibold text-ink-primary">Room Availability</span>
                <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Next 30 Days</span>
              </div>
              
              <div className="flex gap-[2px] h-3 w-full bg-bg-sunken rounded-full overflow-hidden border border-border-subtle p-[1px]">
                {eachDayOfInterval({
                  start: new Date(),
                  end: addDays(new Date(), 29)
                }).map((date, i) => {
                  const localDate = format(date, 'yyyy-MM-dd');
                  const bookingLine = (room.bookings || [])
                    .filter(b => ['confirmed', 'issued', 'arriving_today', 'checked_in', 'checkout_today'].includes(b.status))
                    .find(b => {
                      const startDay = b.check_in_date.split('T')[0];
                      const endDay = b.check_out_date.split('T')[0];
                      return (localDate >= startDay && localDate <= endDay);
                    });

                  let statusColor = 'var(--status-vacant-bg)';
                  let tooltip = `Vacant: ${format(date, 'dd MMM')}`;

                  if (bookingLine) {
                    const bStart = bookingLine.check_in_date.split('T')[0];
                    const bEnd = bookingLine.check_out_date.split('T')[0];
                    
                    if (localDate === bStart) {
                      statusColor = 'var(--status-arriving-border)';
                      tooltip = `Check-in: ${bookingLine.guest_name}`;
                    } else if (localDate === bEnd) {
                      statusColor = 'var(--status-checkout-border)';
                      tooltip = `Check-out: ${bookingLine.guest_name}`;
                    } else {
                      statusColor = 'var(--status-occupied-border)';
                      tooltip = `Occupied: ${bookingLine.guest_name}`;
                    }
                  }

                  return (
                    <div 
                      key={i} 
                      className="flex-1 rounded-[1px]"
                      style={{ backgroundColor: statusColor }}
                      title={tooltip}
                    />
                  );
                })}
              </div>
              
              { (room as any).future_booking ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-accent/5 rounded-lg border border-accent/10">
                  <Info size={12} className="text-accent" />
                  <p className="text-[11px] font-medium text-ink-secondary">
                    {(room as any).future_booking}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/5 rounded-lg border border-green-500/10">
                  <Check size={12} className="text-green-600" />
                  <p className="text-[11px] font-medium text-ink-secondary">Available for the next 30 days</p>
                </div>
              )}
            </div>
          </section>

          {/* Service & Requests */}
          <div className="space-y-8">
            <section className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em]">Active Requests</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all ${activeRequests.length > 0 ? 'bg-status-checkout-bg text-status-checkout-fg' : 'bg-status-vacant-bg text-status-vacant-fg'}`}>
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
                      className="btn btn-accent h-7 px-4 text-[11px] font-semibold" 
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
              className="btn btn-danger w-full py-4"
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
        title="Settle Account & Checkout"
        className="max-w-[480px]"
      >
        <div className="flex flex-col gap-4 py-1">
          {/* Billing Overview */}
          <div className="bg-bg-sunken rounded-2xl p-4 border border-border-subtle">
             <div className="flex justify-between items-center text-[9px] font-bold text-ink-muted uppercase tracking-widest mb-2">
                <span>Final Billing Summary</span>
                <span className="text-accent">{room.booking?.guest_name}</span>
             </div>
             
             <div className="flex flex-col gap-1.5">
               <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-ink-secondary">Room Charges Total</span>
                  <span className="font-sans text-ink-primary">{formatINR(room.booking?.total_amount || 0)}</span>
               </div>
               <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-ink-secondary">Payments Collected</span>
                  <span className="font-sans text-success">-{formatINR(room.booking?.amount_paid || 0)}</span>
               </div>
               <div className="h-px bg-border-subtle/40 border-dashed border-t my-1" />
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-ink-primary">Outstanding Balance</span>
                  <span className="text-lg font-sans font-black text-danger tabular-nums">
                     {formatINR(Math.max(0, (room.booking?.total_amount || 0) - (room.booking?.amount_paid || 0)))}
                  </span>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-ink-muted uppercase tracking-widest ml-1">Collecting Now</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-success">₹</span>
                <input 
                  type="text"
                  className="w-full bg-white border-2 border-border-subtle rounded-xl pl-8 pr-4 py-2 text-base font-sans font-bold text-success focus:border-accent outline-none transition-all"
                  value={checkoutPayAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setCheckoutPayAmount(val === '' ? 0 : parseInt(val));
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
               <label className="text-[9px] font-bold text-ink-muted uppercase tracking-widest ml-1">Official Checkout Time</label>
               <div className="bg-bg-sunken border border-border-subtle rounded-xl px-4 py-2 text-sm font-bold text-ink-secondary flex items-center h-full min-h-[46px]">
                  <div className="flex items-center gap-2">
                     <Clock size={16} className="text-accent" />
                     <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
             <label className="text-[9px] font-bold text-ink-muted uppercase tracking-widest ml-1">Payment Mode</label>
             <div className="flex gap-1 bg-bg-sunken p-1 rounded-xl border border-border-subtle">
                {(['UPI', 'Cash', 'Card'] as const).map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`h-10 flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${paymentMode === mode ? 'bg-accent text-white shadow-lg shadow-accent/25' : 'text-ink-muted hover:text-ink-secondary'}`}
                  >
                    {mode}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-ink-muted uppercase tracking-widest ml-1">Internal Remarks</label>
            <textarea 
              className="w-full bg-bg-sunken/40 border border-border-subtle rounded-xl px-4 py-2.5 text-[11px] font-medium text-ink-primary min-h-[64px] focus:bg-white focus:border-accent outline-none transition-all resize-none"
              placeholder="Room condition, bar usage, early checkout reason..."
              value={checkoutNote}
              onChange={(e) => setCheckoutNote(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button 
              onClick={async () => {
                if (room.booking) {
                  try {
                    setIsSaving(true);
                    await finalCheckout(room.booking.id, checkoutPayAmount, paymentMode, checkoutNote);
                    toast(`Guest checkout completed. Room is now scheduled for cleaning.`, "success");
                    setModalOpen(null);
                    onClose();
                  } catch (e) {
                    toast("Checkout process failed. Please check connection.", "error");
                  } finally {
                    setIsSaving(false);
                  }
                }
              }}
              className="btn btn-accent py-4 shadow-lg shadow-accent/20 text-sm font-bold flex items-center justify-center gap-2"
              disabled={isSaving}
            >
              <LogOut size={16} />
              <span>{isSaving ? 'Processing...' : 'Finalize Checkout'}</span>
            </button>
            <button className="text-[10px] font-bold text-ink-muted hover:text-accent transition-colors" onClick={() => setModalOpen(null)}>Go Back</button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Extend Stay */}
      <Modal
        isOpen={modalOpen === 'extend'}
        onClose={() => setModalOpen(null)}
        title="Extend Guest Stay"
        className="max-w-[460px]"
        footer={
          <>
            <button className="btn btn-ghost px-6" onClick={() => setModalOpen(null)}>Cancel</button>
            <button 
              className="btn btn-accent px-10 shadow-lg shadow-accent/20" 
              disabled={isSaving || extensionData.days <= 0}
              onClick={async () => {
                if (!room?.booking) return;
                setIsSaving(true);
                try {
                  const updatedTotal = (Number(room.booking.total_amount) || 0) + extensionData.extraCharges;
                  await updateBooking(room.booking.id, {
                    check_out_date: extensionData.newCheckoutDate,
                    total_amount: updatedTotal
                  });
                  toast(`Stay extended until ${formatDate(extensionData.newCheckoutDate)}`, "success");
                  setModalOpen(null);
                } catch (e) {
                  toast("Failed to extend stay", "error");
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving ? 'Updating...' : 'Confirm Extension'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-6 py-2">
          {/* Guest Context */}
          <div className="flex items-center gap-4 p-4 bg-bg-sunken rounded-2xl border border-border-subtle">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Plus size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Extending Stay For</span>
              <span className="text-sm font-bold text-ink-primary">{room.booking?.guest_name}</span>
            </div>
          </div>

          {/* Stay Timeline Reference */}
          <div className="bg-bg-sunken/50 rounded-2xl p-4 border border-border-subtle flex items-center justify-between mb-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest leading-none">Check-in</span>
              <span className="text-xs font-bold text-ink-secondary">{room.booking ? formatDate(room.booking.check_in_date) : '-'}</span>
            </div>
            <div className="flex flex-col items-center">
              <ArrowRight size={14} className="text-ink-muted opacity-40 mb-1" />
              <div className="h-px w-12 bg-border-subtle" />
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest leading-none text-right">Original Checkout</span>
              <span className="text-xs font-bold text-ink-secondary text-right">{room.booking ? formatDate(room.booking.check_out_date) : '-'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-accent uppercase tracking-widest ml-1">New Extended Check-out</label>
            <div className="relative group">
              <input 
                type="date" 
                className="w-full bg-white border-2 border-accent/20 rounded-xl px-4 py-3 text-sm font-bold text-ink-primary focus:border-accent outline-none shadow-sm transition-all" 
                value={extensionData.newCheckoutDate}
                min={room.booking ? room.booking.check_out_date.split('T')[0] : ''}
                onChange={(e) => {
                  if (!room.booking) return;
                  const newDate = e.target.value;
                  const currentEnd = parseISO(room.booking.check_out_date);
                  const selectedEnd = parseISO(newDate);
                  const diff = Math.max(0, differenceInDays(selectedEnd, currentEnd));
                  
                  setExtensionData({
                    ...extensionData,
                    newCheckoutDate: newDate,
                    days: diff,
                    extraCharges: diff * (Number(room.base_price) || 1500)
                  });
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-accent/5 border border-accent/10 rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Extended For</span>
                  <span className="text-lg font-display font-black text-accent">
                    {extensionData.days > 0 ? `+${extensionData.days} ${extensionData.days === 1 ? 'Day' : 'Days'}` : 'No extension selected'}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5 items-end">
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mr-1">Additional Charges</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-primary">₹</span>
                    <input 
                      type="text"
                      className="w-24 bg-white border border-border-subtle rounded-lg pl-6 pr-2 py-1.5 text-xs font-bold text-ink-primary text-right tabular-nums focus:border-accent outline-none"
                      value={extensionData.extraCharges}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setExtensionData({
                          ...extensionData,
                          extraCharges: val === '' ? 0 : parseInt(val)
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-accent/10 w-full" />

              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-ink-secondary">New Final Total</span>
                <span className="text-sm font-sans font-bold text-ink-primary">
                  {formatINR((Number(room.booking?.total_amount) || 0) + extensionData.extraCharges)}
                </span>
              </div>
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
                     }
                   }}
                   className="flex items-center justify-between p-4 rounded-2xl border border-border-subtle bg-white hover:bg-bg-sunken hover:border-accent group transition-all"
                 >
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-success/5 border border-success/10 flex items-center justify-center text-success font-bold font-sans">
                       {vRoom.room_number}
                     </div>
                     <div className="flex flex-col text-left">
                       
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
