'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Home,
  Check,
  Globe,
  Car,
  FileDigit,
  Smartphone,
  Building2
} from 'lucide-react';
import Select from '@/components/ui/Select';
import { Room, BookingStatus } from '@/types';

type IDType = 'aadhaar' | 'passport' | 'driving_license' | 'voter_id' | 'other';
import { formatINR, formatDate } from '@/lib/formatting';
import Badge from '@/components/ui/Badge';
import { differenceInCalendarDays, addDays, format, areIntervalsOverlapping, parseISO } from 'date-fns';
import { getStoredRooms, addBooking, getBookingsForRoom, getAvailableRoomCount, getRoomBlockedDates, getSelectedProperty, getBookingById, updateBookingStatus, updateBooking } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import CalendarPicker from '@/components/ui/CalendarPicker';


function BookingFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const roomId = searchParams.get('room_id') || searchParams.get('room');
  const propertyId = searchParams.get('property') || getSelectedProperty() || '010';
  const bookingId = searchParams.get('booking_id');
  const [isPreFilling, setIsPreFilling] = useState(false);
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Default booking type based on date (Today = Walk-in, Future = Reservation)
  const [bookingType, setBookingType] = useState<'walk-in' | 'reservation'>(
    (new Date(searchParams.get('check_in') || Date.now()).toLocaleDateString() === new Date().toLocaleDateString()) ? 'walk-in' : 'reservation'
  );

  useEffect(() => {
    const init = async () => {
      const fetchedRooms = await getStoredRooms([]);
      setRooms(fetchedRooms);

      if (bookingId) {
        setIsPreFilling(true);
        const booking = await getBookingById(bookingId);
        if (booking) {
          setFormData(prev => ({
            ...prev,
            guestName: booking.guest_name,
            guestPhone: booking.guest_phone,
            numAdults: booking.adults || 1,
            numChildren: booking.children || 0,
            numInfants: booking.infants || 0,
            checkInDate: booking.check_in_date.split('T')[0],
            checkOutDate: booking.check_out_date.split('T')[0],
            pricePerNight: Math.round(booking.total_amount / (Math.max(1, (parseISO(booking.check_out_date).getTime() - parseISO(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)))),
            advancePaid: booking.amount_paid || 0,
            paymentMethod: booking.payment_method || 'cash',
            selectedRoomId: booking.room_id || roomId || '',
            nationality: booking.nationality || 'indian',
            idType: booking.id_type || 'aadhaar',
            idNumber: booking.id_number || '',
            address: booking.address || '',
          }));
          setBookingType('walk-in');
        }
        setIsPreFilling(false);
      }
      setLoading(false);
    };
    init();
  }, [bookingId, roomId]);

  useEffect(() => {
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    if (name || phone) {
      setFormData(prev => ({
        ...prev,
        guestName: name || prev.guestName,
        guestPhone: phone || prev.guestPhone
      }));
      // Auto-switch to walk-in if coming from dashboard check-in
      if (name) setBookingType('walk-in');
    }
  }, [searchParams]);
  
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    extraAdultNames: [] as string[],
    extraChildNames: [] as string[],
    extraInfantNames: [] as string[],
    nationality: 'indian' as 'indian' | 'international',
    idType: 'aadhaar' as IDType,
    idNumber: '',
    address: '',
    purpose: 'leisure',
    numAdults: 1,
    numChildren: 0,
    numInfants: 0,
    checkInDate: searchParams.get('check_in') || format(new Date(), 'yyyy-MM-dd'),
    checkOutDate: searchParams.get('check_out') || format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    pricePerNight: 0,
    advancePaid: 0,
    paymentMethod: 'cash' as any,
    includeTax: false,
    selectedRoomId: '', // Will be set in useEffect
    
    // International Specifics (Form C)
    passportNumber: '',
    visaNumber: '',
    arrivalDateIndia: '',
  });

  const propertyRooms = rooms.filter(r => r.property_id === propertyId);
  const selectedRoom = rooms.find(r => r.id === formData.selectedRoomId);

  useEffect(() => {
    if (rooms.length > 0 && !formData.selectedRoomId) {
       // Search by ID first, then by room number in property
       const found = rooms.find(r => r.id === roomId) || rooms.find(r => r.room_number === roomId && r.property_id === propertyId);
       if (found) {
         setFormData(prev => ({ ...prev, selectedRoomId: found.id }));
       }
    }
  }, [rooms, roomId, propertyId, formData.selectedRoomId]);

  useEffect(() => {
    if (!bookingId) {
      if (selectedRoom && formData.pricePerNight === 0) {
        setFormData(prev => ({ ...prev, pricePerNight: selectedRoom.base_price }));
      } else if (!selectedRoom && propertyRooms.length > 0 && formData.pricePerNight === 0) {
        setFormData(prev => ({ ...prev, pricePerNight: propertyRooms[0].base_price }));
      }
    }
  }, [selectedRoom, propertyRooms, formData.pricePerNight, bookingId]);

  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  useEffect(() => {
    if (formData.selectedRoomId) {
      getRoomBlockedDates(formData.selectedRoomId).then(setBlockedDates);
    } else {
      setBlockedDates([]);
    }
  }, [formData.selectedRoomId]);

  const nights = Math.max(1, differenceInCalendarDays(
    new Date(formData.checkOutDate),
    new Date(formData.checkInDate)
  ));

  const baseAmount = nights * formData.pricePerNight;
  const totalAmount = formData.includeTax ? baseAmount * 1.12 : baseAmount;
  const balanceDue = totalAmount - formData.advancePaid;

  const handleSubmit = async () => {
    if (!formData.guestName || formData.guestPhone.length !== 10) {
      toast("Valid name and 10-digit phone number are required", "error");
      return;
    }

    if (bookingType === 'walk-in' && !formData.selectedRoomId) {
      toast("Please select a room for walk-in", "error");
      return;
    }

    // Determine status
    let status: BookingStatus = 'unassigned';
    if (bookingType === 'walk-in') {
      status = 'checked_in';
    } else {
      // Future reservations are always unassigned until arrival
      status = 'unassigned';
    }

    const newBooking = {
      id: `b-${Date.now()}`,
      room_id: formData.selectedRoomId || undefined,
      property_id: propertyId,
      owner_id: '00000000-0000-0000-0000-000000000000',
      guest_name: formData.guestName,
      guest_phone: formData.guestPhone.startsWith('+91') ? formData.guestPhone : `+91 ${formData.guestPhone}`,
      guest_id_type: formData.nationality === 'international' ? 'passport' : formData.idType,
      guest_id_number: formData.nationality === 'international' ? formData.passportNumber : formData.idNumber,
      check_in_date: formData.checkInDate,
      check_out_date: formData.checkOutDate,
      num_guests: formData.numAdults + formData.numChildren,
      price_per_night: formData.pricePerNight,
      total_amount: totalAmount,
      amount_paid: formData.advancePaid,
      payment_method: formData.paymentMethod,
      status: status,
      created_at: new Date().toISOString(),
      metadata: {
        nationality: formData.nationality,
        num_infants: formData.numInfants,
        purpose: formData.purpose,
        address: formData.address,
        visa_number: formData.visaNumber,
        extra_guests: [
          ...formData.extraAdultNames,
          ...formData.extraChildNames,
          ...formData.extraInfantNames
        ].filter(Boolean)
      }
    };

    try {
      if (bookingId) {
        // Update existing booking
        const updates = {
          ...newBooking,
          id: bookingId, // Keep original ID
        };
        delete (updates as any).created_at; // Don't overide creation date

        await updateBooking(bookingId, updates as any);
        toast("Reservation checked in successfully", "success");
      } else {
        // Create new booking
        await addBooking(newBooking as any);
        toast(status === 'checked_in' ? "Check-in successful" : "Reservation confirmed", "success");
      }
      setIsSuccess(true);
    } catch (err) {
      toast("Failed to save booking", "error");
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] animate-slide-up text-center px-6">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success mb-6">
          <Check size={40} strokeWidth={3} />
        </div>
        <h1 className="text-3xl font-display text-ink-primary mb-2">
          {bookingType === 'walk-in' ? 'Check-in Successful!' : 'Reservation Confirmed!'}
        </h1>
        <p className="text-ink-secondary mb-8 max-w-md">
          {bookingType === 'walk-in' ? (
            <>Room <strong>{selectedRoom?.room_number}</strong> is now occupied. Guest details are saved.</>
          ) : (
            <>Reservation for <strong>{formData.guestName}</strong> is confirmed.</>
          )}
        </p>

        <div className="flex flex-col w-full max-w-xs gap-3">
          <Link href={`/property/${propertyId}`} className="btn btn-accent w-full py-4 rounded-full font-semibold flex items-center justify-center gap-2">
            <Home size={18} /> Back to Property
          </Link>
          <button onClick={() => router.push('/dashboard')} className="btn btn-secondary w-full py-4 rounded-full font-semibold border border-border-subtle">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col min-h-screen pt-4 pb-20 md:pb-8 px-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-border-subtle gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-bg-sunken transition-colors text-ink-secondary">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-3xl font-sans font-semibold text-ink-primary tracking-tighter">New Booking</h1>
            <p className="text-sm text-ink-muted">
              {propertyRooms.length > 0 ? (propertyId === '010' ? 'The Peace' : 'The Starry Nights') : 'Select property'}
            </p>
          </div>
        </div>

        <div className={`flex gap-1 p-1 bg-bg-sunken rounded-xl border border-border-subtle self-start md:self-center ${bookingId ? 'opacity-50 pointer-events-none grayscale cursor-not-allowed' : ''}`}>
          <button 
            type="button"
            onClick={() => !bookingId && setBookingType('walk-in')}
            className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${bookingType === 'walk-in' ? 'bg-accent text-white shadow-md' : 'text-ink-muted hover:text-ink-secondary'}`}
          >
            Walk-in now
          </button>
          <button 
            type="button"
            onClick={() => {
              if (!bookingId) {
                setBookingType('reservation');
                updateField('selectedRoomId', ''); // Clear room for future reservations
              }
            }}
            className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${bookingType === 'reservation' ? 'bg-accent text-white shadow-md' : 'text-ink-muted hover:text-ink-secondary'}`}
          >
            Future reservation
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          {/* Section 1: Dates & Room */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium text-xs">1</div>
              <h2 className="text-lg font-sans text-ink-primary font-semibold tracking-tight">Stay Details</h2>
            </div>

            <div className="flex flex-col gap-2">
              <label className="label mb-2">Select Duration</label>
              <CalendarPicker 
                startDate={formData.checkInDate}
                endDate={formData.checkOutDate}
                blockedDates={blockedDates}
                onChange={(start, end) => {
                  setFormData(prev => ({ ...prev, checkInDate: start, checkOutDate: end }));
                }}
              />
            </div>

            {bookingType === 'walk-in' && (
              <div className="field">
                <label className="label">Select Room Number*</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {propertyRooms.map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (r.status === 'vacant' || r.status === 'cleaning' || formData.selectedRoomId === r.id) {
                          updateField('selectedRoomId', r.id);
                        }
                      }}
                      className={`py-2 rounded-full text-sm font-semibold border transition-all ${
                        formData.selectedRoomId === r.id 
                          ? 'bg-accent text-white border-accent shadow-md' 
                          : r.status === 'vacant' || r.status === 'cleaning'
                            ? 'bg-white text-ink-primary border-border-subtle hover:border-accent'
                            : 'bg-bg-sunken text-ink-muted border-transparent cursor-not-allowed opacity-40'
                      }`}
                    >
                      {r.room_number}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1 px-3 py-2 bg-bg-sunken rounded-xl border border-border-subtle">
                <label className="text-[10px] font-semibold text-ink-muted uppercase">Adults</label>
                <div className="flex items-center justify-between">
                  <button onClick={() => updateField('numAdults', Math.max(1, formData.numAdults - 1))} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-ink-muted hover:text-ink-primary">−</button>
                  <span className="font-mono text-lg">{formData.numAdults}</span>
                  <button onClick={() => updateField('numAdults', formData.numAdults + 1)} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-ink-muted hover:text-ink-primary">+</button>
                </div>
              </div>
              <div className="flex flex-col gap-1 px-3 py-2 bg-bg-sunken rounded-xl border border-border-subtle">
                <label className="text-[10px] font-semibold text-ink-muted uppercase">Children</label>
                <div className="flex items-center justify-between">
                  <button onClick={() => updateField('numChildren', Math.max(0, formData.numChildren - 1))} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-ink-muted hover:text-ink-primary">−</button>
                  <span className="font-mono text-lg">{formData.numChildren}</span>
                  <button onClick={() => updateField('numChildren', formData.numChildren + 1)} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-ink-muted hover:text-ink-primary">+</button>
                </div>
              </div>
              <div className="flex flex-col gap-1 px-3 py-2 bg-bg-sunken rounded-xl border border-border-subtle">
                <label className="text-[10px] font-semibold text-ink-muted uppercase">Infants</label>
                <div className="flex items-center justify-between">
                  <button onClick={() => updateField('numInfants', Math.max(0, formData.numInfants - 1))} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-ink-muted hover:text-ink-primary">−</button>
                  <span className="font-mono text-lg">{formData.numInfants}</span>
                  <button onClick={() => updateField('numInfants', formData.numInfants + 1)} className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-ink-muted hover:text-ink-primary">+</button>
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-border-strong/50" />

          {/* Section 2: Guest ID (Only for Walk-in) */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium text-xs">2</div>
              <h2 className="text-lg font-sans text-ink-primary font-semibold tracking-tight">Primary Guest</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="field col-span-full">
                <label className="label">Full Name*</label>
                <input
                  type="text"
                  className="input py-4 text-base"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.guestName}
                  onChange={(e) => updateField('guestName', e.target.value)}
                />
              </div>

              <div className="field">
                <label className="label">Phone Number*</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium border-r pr-3 mr-3">+91</div>
                    <input
                      type="tel"
                      className="input pl-16 font-mono"
                      placeholder="9876543210"
                      value={formData.guestPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        updateField('guestPhone', val);
                      }}
                    />
                </div>
              </div>

              <div className="field">
                <label className="label">Nationality</label>
                <div className="flex gap-1 p-1 bg-bg-sunken rounded-lg border border-border-subtle h-[46px]">
                    <button 
                      onClick={() => updateField('nationality', 'indian')}
                      className={`flex-1 rounded-full text-[10px] font-semibold transition-all ${formData.nationality === 'indian' ? 'bg-white shadow text-ink-primary' : 'text-ink-muted'}`}
                    >🇮🇳 Indian</button>
                    <button 
                      onClick={() => updateField('nationality', 'international')}
                      className={`flex-1 rounded-full text-[10px] font-semibold transition-all ${formData.nationality === 'international' ? 'bg-white shadow text-ink-primary' : 'text-ink-muted'}`}
                    >🌎 Intl</button>
                </div>
              </div>

              {bookingType === 'walk-in' && (
                <>
                  <div className="field">
                    <label className="label">ID Type (Optional)</label>
                    <select 
                      className="input h-[46px]" 
                      value={formData.idType}
                      onChange={e => updateField('idType', e.target.value)}
                    >
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="driving_license">Driving License</option>
                      <option value="passport">Passport</option>
                      <option value="voter_id">Voter ID</option>
                      <option value="other">Other Govt ID</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="label">ID Number (Optional)</label>
                    <input
                      type="text"
                      className="input font-mono"
                      placeholder={
                        formData.idType === 'aadhaar' ? '12 digits' :
                        formData.idType === 'driving_license' ? '15 characters' :
                        formData.idType === 'passport' ? 'Max 10 chars' : 'Enter ID number'
                      }
                      value={formData.idNumber}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (formData.idType === 'aadhaar') {
                          val = val.replace(/\D/g, '').slice(0, 12);
                        } else if (formData.idType === 'driving_license') {
                          val = val.slice(0, 15);
                        } else if (formData.idType === 'passport') {
                          val = val.slice(0, 10);
                        }
                        updateField('idNumber', val);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          <div className="h-px bg-border-strong/50" />

          {/* Section 3: Finance */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium text-xs">3</div>
              <h2 className="text-lg font-sans text-ink-primary font-semibold tracking-tight">Billing & Payment</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="field text-sm">
                <label className="label">Room Rate (Per Night)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted font-mono">₹</span>
                  <input
                    type="number"
                    className="input pl-8 font-mono h-11"
                    value={formData.pricePerNight}
                    onChange={(e) => updateField('pricePerNight', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="field text-sm">
                <label className="label">Advance Paid</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted font-mono">₹</span>
                  <input
                    type="number"
                    className="input pl-8 font-mono h-11 border-accent"
                    value={formData.advancePaid}
                    onChange={(e) => updateField('advancePaid', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="field col-span-full">
                <label className="label">Payment Mode</label>
                <div className="flex gap-2">
                  {['cash', 'upi', 'card'].map(m => (
                    <button
                      key={m}
                      onClick={() => updateField('paymentMethod', m)}
                      className={`flex-1 py-3 rounded-full border text-[10px] font-semibold transition-all ${
                        formData.paymentMethod === m ? 'bg-ink-primary text-white border-ink-primary' : 'bg-white text-ink-secondary border-border-subtle hover:bg-bg-sunken'
                      }`}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Right Sidebar: Summary */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-white rounded-2xl border border-border-strong p-6 sticky top-24 shadow-xl flex flex-col gap-6">
            <div className="flex flex-col gap-1">
               <span className="text-[10px] font-semibold text-accent uppercase tracking-widest">{bookingType === 'walk-in' ? 'Check-in Summary' : 'Reservation Summary'}</span>
               <h3 className="text-xl font-display font-semibold text-ink-primary">₹{totalAmount.toLocaleString()}</h3>
            </div>

            <div className="flex flex-col gap-3 py-4 border-y border-border-subtle">
               <div className="flex justify-between text-xs">
                 <span className="text-ink-muted">Stay Duration</span>
                 <span className="text-ink-primary font-medium">{nights} Nights</span>
               </div>
                {bookingType === 'walk-in' && (
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-muted">Room Number</span>
                    <span className="text-ink-primary font-medium">{selectedRoom?.room_number || 'Unassigned'}</span>
                  </div>
                )}
               <div className="flex justify-between text-xs">
                 <span className="text-ink-muted">Total Guests</span>
                 <span className="text-ink-primary font-medium">{formData.numAdults + formData.numChildren} Count</span>
               </div>
            <div className="flex justify-between pt-2 mt-1 border-t border-dashed text-sm">
                 <span className="font-semibold text-ink-primary">Balance Due</span>
                 <span className="font-mono font-semibold text-danger text-base">₹{balanceDue.toLocaleString()}</span>
               </div>
            </div>

            {(() => {
              const isFormValid = !!(
                formData.guestName.trim() && 
                formData.guestPhone.length === 10 && 
                (bookingType === 'walk-in' ? formData.selectedRoomId : true)
              );

              return (
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className="btn btn-accent w-full py-4 rounded-full flex items-center justify-center gap-2 font-semibold shadow-lg shadow-accent/20"
                >
                  {bookingType === 'walk-in' ? 'Perform Check-in' : 'Confirm Reservation'}
                  <ChevronRight size={18} />
                </button>
              );
            })()}
            <p className="text-[10px] text-center text-ink-muted italic">By clicking you agree to the property terms & conditions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewCheckInPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-ink-muted">Loading Booking Form...</div>}>
      <BookingFlow />
    </Suspense>
  );
}

