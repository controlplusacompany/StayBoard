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
import { getStoredRooms, addBooking, getBookingsForRoom, getAvailableRoomTypeCount, getRoomBlockedDates } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import CalendarPicker from '@/components/ui/CalendarPicker';


function BookingFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const roomId = searchParams.get('room_id');
  const roomNumber = searchParams.get('room');
  const propertyId = searchParams.get('property');
  
  const [isSuccess, setIsSuccess] = useState(false);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredRooms([]).then(fetchedRooms => {
      setRooms(fetchedRooms);
      setLoading(false);
    });
  }, []);
  
  // Find room by ID or by (number + property)
  const room = rooms.find(r => 
    r.id === roomId || 
    (r.room_number === roomNumber && r.property_id === propertyId)
  ) || (rooms.length > 0 ? rooms[0] : { id: 'temp', room_number: roomNumber || '?', property_id: propertyId || '?', room_type: 'Unknown', base_price: 1500, floor: 1 });

  // Form State
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
    checkInDate: format(new Date(), 'yyyy-MM-dd'),
    checkOutDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    pricePerNight: 0,
    advancePaid: 0,
    paymentMethod: 'cash' as any,
    includeTax: false,
    
    // International Specifics (Form C)
    passportNumber: '',
    visaNumber: '',
    arrivalDateIndia: '',
  });

  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  useEffect(() => {
    if (room && room.id !== 'temp') {
      getRoomBlockedDates(room.id).then(setBlockedDates);
    }
  }, [room?.id]);

  // Set initial price when room is found
  React.useEffect(() => {
    if (room && formData.pricePerNight === 0) {
      setFormData(prev => ({ ...prev, pricePerNight: room.base_price }));
    }
  }, [room]);

  const nights = differenceInCalendarDays(
    new Date(formData.checkOutDate),
    new Date(formData.checkInDate)
  );

  const baseAmount = (nights > 0 ? nights : 1) * formData.pricePerNight;
  const totalAmount = formData.includeTax ? baseAmount * 1.12 : baseAmount;
  const balanceDue = totalAmount - formData.advancePaid;

  const handleSubmit = async () => {
    if (!formData.guestName || !formData.guestPhone) {
      toast("Please enter Name and Phone Number", "error");
      return;
    }

    if (formData.nationality === 'international' && !formData.passportNumber) {
      toast("Passport details are mandatory for international guests (Form C)", "error");
      return;
    }

    // INVENTORY PROTECTION: Check if this room type has actual available count for the selected dates.
    // This is a final check to prevent clashes with unassigned online bookings.
    const from = formData.checkInDate;
    const to = formData.checkOutDate;
    const availCount = await getAvailableRoomTypeCount(room.property_id, room.room_type, from, to);
    
    if (availCount <= 0) {
      toast(`All ${room.room_type} rooms are already committed for these dates (including unassigned online bookings).`, "error");
      return;
    }

    // Conflict Check
    const existingBookings = await getBookingsForRoom(room.id);
    const newStartStr = formData.checkInDate;
    const newEndStr = formData.checkOutDate;

    const conflict = existingBookings.find(b => {
      const bStartStr = b.check_in_date.split('T')[0];
      const bEndStr = b.check_out_date.split('T')[0];
      
      // They overlap if max(start1, start2) < min(end1, end2)
      // Since they are strings in YYYY-MM-DD, string comparison works perfectly.
      return newStartStr < bEndStr && bStartStr < newEndStr;
    });

    if (conflict) {
      toast(`Room ${room.room_number} is already booked from ${formatDate(conflict.check_in_date)} to ${formatDate(conflict.check_out_date)} (${conflict.guest_name})`, "error");
      return;
    }

    // Create actual booking
    const newBooking = {
      id: `b-${Date.now()}`,
      room_id: room.id,
      property_id: room.property_id,
      owner_id: '001',
      guest_name: formData.guestName,
      guest_phone: `+91 ${formData.guestPhone}`,
      guest_id_type: formData.nationality === 'international' ? 'passport' : formData.idType,
      guest_id_number: formData.nationality === 'international' ? formData.passportNumber : formData.idNumber,
      check_in_date: formData.checkInDate,
      check_out_date: formData.checkOutDate,
      num_guests: formData.numAdults + formData.numChildren,
      price_per_night: formData.pricePerNight,
      total_amount: totalAmount,
      amount_paid: formData.advancePaid,
      payment_method: formData.paymentMethod,
      status: 'checked_in' as any,
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

    await addBooking(newBooking);
    toast("Check-in successful", "success");
    setIsSuccess(true);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] animate-slide-up text-center px-6">
        <div className="w-20 h-20 bg-success-bg rounded-full flex items-center justify-center text-success mb-6 animate-check">
          <Check size={40} strokeWidth={3} />
        </div>
        <h1 className="text-3xl font-display text-ink-primary mb-2">Check-in Successful!</h1>
        <p className="text-ink-secondary mb-8 max-w-md">
          Room <strong>{room.room_number}</strong> is now marked as occupied. The guest card has been generated.
        </p>

        <div className="flex flex-col w-full max-w-xs gap-3">
          <Link href={`/property/${room.property_id}`} className="btn-accent w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2">
            <Home size={18} />
            Back to Property
          </Link>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 border border-border-subtle"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col min-h-screen pt-4 pb-20 md:pb-8 px-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-border-subtle">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-bg-sunken transition-colors text-ink-secondary"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-3xl font-display text-ink-primary tracking-tight">New Booking</h1>
            <p className="text-sm text-ink-secondary">Quick onboarding for Room {room.room_number}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
        {/* Left: Form Sections */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          {/* SECTION 1: STAY & OCCUPANCY (NOW AT TOP) */}
          <section className="flex flex-col gap-6 animate-slide-up relative z-[40]" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-xs">1</div>
              <h2 className="text-lg font-display text-ink-primary font-medium">Stay & Occupancy</h2>
            </div>

            <div className="flex flex-col gap-2">
              <label className="label mb-2">Select Duration (Visual Calendar)</label>
              <CalendarPicker 
                startDate={formData.checkInDate}
                endDate={formData.checkOutDate}
                blockedDates={blockedDates}
                onChange={(start, end) => {
                  setFormData(prev => ({ ...prev, checkInDate: start, checkOutDate: end }));
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2 p-3 bg-bg-sunken rounded-xl border border-border-subtle">
                <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Adults</label>
                <div className="flex items-center justify-between">
                  <button onClick={() => updateField('numAdults', Math.max(1, formData.numAdults - 1))} className="w-7 h-7 rounded-full bg-white shadow-sm border border-border-subtle flex items-center justify-center text-ink-primary hover:bg-bg-sunken">−</button>
                  <span className="text-lg font-display font-semibold">{formData.numAdults}</span>
                  <button onClick={() => updateField('numAdults', formData.numAdults + 1)} className="w-7 h-7 rounded-full bg-white shadow-sm border border-border-subtle flex items-center justify-center text-ink-primary hover:bg-bg-sunken">+</button>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-3 bg-bg-sunken rounded-xl border border-border-subtle">
                <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Children (5-12y)</label>
                <div className="flex items-center justify-between">
                  <button onClick={() => updateField('numChildren', Math.max(0, formData.numChildren - 1))} className="w-7 h-7 rounded-full bg-white shadow-sm border border-border-subtle flex items-center justify-center text-ink-primary hover:bg-bg-sunken">−</button>
                  <span className="text-lg font-display font-semibold">{formData.numChildren}</span>
                  <button onClick={() => updateField('numChildren', formData.numChildren + 1)} className="w-7 h-7 rounded-full bg-white shadow-sm border border-border-subtle flex items-center justify-center text-ink-primary hover:bg-bg-sunken">+</button>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-3 bg-bg-sunken rounded-xl border border-border-subtle">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Infant (&lt;5y)</label>
                  <span className="text-[9px] font-semibold text-success uppercase">Free</span>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => updateField('numInfants', Math.max(0, formData.numInfants - 1))} className="w-7 h-7 rounded-full bg-white shadow-sm border border-border-subtle flex items-center justify-center text-ink-primary hover:bg-bg-sunken">−</button>
                  <span className="text-lg font-display font-semibold">{formData.numInfants}</span>
                  <button onClick={() => updateField('numInfants', formData.numInfants + 1)} className="w-7 h-7 rounded-full bg-white shadow-sm border border-border-subtle flex items-center justify-center text-ink-primary hover:bg-bg-sunken">+</button>
                </div>
              </div>
            </div>
          </section>

          <div className="h-px w-full bg-border-subtle opacity-50 my-2" />

          {/* SECTION 2: GUEST DETAILS */}
          <section className="flex flex-col gap-6 animate-slide-up relative z-[30]" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-xs">2</div>
              <h2 className="text-lg font-display text-ink-primary font-medium">Guest Details</h2>
            </div>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="field col-span-full">
                  <label className="label">Primary Guest Full Name*</label>
                  <div className="relative group/name">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-accent/5 flex items-center justify-center text-accent transition-colors group-focus-within/name:bg-accent group-focus-within/name:text-white">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      className="input pl-14 py-4 text-base font-sans border-border-subtle focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all"
                      placeholder="Jane Cooper / John Doe (Required)"
                      value={formData.guestName}
                      onChange={(e) => updateField('guestName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Guest Phone Number*</label>
                  <div className="flex items-center gap-3 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10 focus-within:bg-bg-surface transition-all bg-bg-sunken border-1.5 border-border-subtle rounded-xl overflow-hidden px-4 h-[50px]">
                    <div className="flex items-center gap-2 pr-3 border-r border-border-strong text-ink-muted">
                       <Smartphone size={14} />
                       <span className="text-sm font-semibold">+91</span>
                    </div>
                    <input
                      type="tel"
                      className="flex-1 bg-transparent border-none outline-none font-mono text-ink-primary text-base"
                      placeholder="98765 43210"
                      value={formData.guestPhone}
                      onChange={(e) => updateField('guestPhone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Nationality</label>
                  <div className="flex gap-1 p-1 bg-bg-sunken rounded-lg border border-border-subtle w-full h-[50px]">
                    <button 
                      onClick={() => updateField('nationality', 'indian')}
                      className={`flex-1 rounded-md text-[11px] font-semibold transition-all uppercase tracking-wider ${formData.nationality === 'indian' ? 'bg-white text-ink-primary shadow-sm' : 'text-ink-muted hover:text-ink-secondary'}`}
                    >
                      🇮🇳 Indian
                    </button>
                    <button 
                      onClick={() => updateField('nationality', 'international')}
                      className={`flex-1 rounded-md text-[11px] font-semibold transition-all uppercase tracking-wider ${formData.nationality === 'international' ? 'bg-white text-ink-primary shadow-sm' : 'text-ink-muted hover:text-ink-secondary'}`}
                    >
                      🌎 Intl
                    </button>
                  </div>
                </div>

              {/* Dynamic Adult Names */}
              {Array.from({ length: formData.numAdults - 1 }).map((_, i) => (
                <div key={`adult-${i}`} className="field">
                  <label className="label">Adult {i + 2} Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Guest name (Optional)"
                    value={formData.extraAdultNames[i] || ''}
                    onChange={(e) => {
                      const newNames = [...formData.extraAdultNames];
                      newNames[i] = e.target.value;
                      updateField('extraAdultNames', newNames);
                    }}
                  />
                </div>
              ))}

              {/* Dynamic Child Names */}
              {Array.from({ length: formData.numChildren }).map((_, i) => (
                <div key={`child-${i}`} className="field">
                  <label className="label">Child {i + 1} Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Name (Optional)"
                    value={formData.extraChildNames[i] || ''}
                    onChange={(e) => {
                      const newNames = [...formData.extraChildNames];
                      newNames[i] = e.target.value;
                      updateField('extraChildNames', newNames);
                    }}
                  />
                </div>
              ))}

              {/* Dynamic Infant Names */}
              {Array.from({ length: formData.numInfants }).map((_, i) => (
                <div key={`infant-${i}`} className="field">
                  <label className="label">Infant {i + 1} Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Name (Optional)"
                    value={formData.extraInfantNames[i] || ''}
                    onChange={(e) => {
                      const newNames = [...formData.extraInfantNames];
                      newNames[i] = e.target.value;
                      updateField('extraInfantNames', newNames);
                    }}
                  />
                </div>
              ))}

              <div className="field col-span-full">
                <label className="label">Permanent Address / City & State</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. New Delhi, India"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>

              <Select 
                options={[
                  { id: 'leisure', label: 'Leisure / Vacation', icon: Globe },
                  { id: 'business', label: 'Business Trip', icon: Building2 },
                  { id: 'transit', label: 'Transit', icon: Car },
                  { id: 'other', label: 'Other', icon: FileDigit }
                ]}
                value={formData.purpose}
                onChange={(val) => updateField('purpose', val)}
                label="Purpose of Visit"
              />
            </div>
          </section>

          <div className="h-px w-full bg-border-subtle opacity-50 my-2" />

          {/* SECTION 3: IDENTITY VERIFICATION */}
          <section className="flex flex-col gap-6 animate-slide-up relative z-[20]" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-xs">3</div>
              <h2 className="text-lg font-display text-ink-primary font-medium">Identity Docs</h2>
            </div>

            {formData.nationality === 'indian' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select 
                  options={[
                    { id: 'aadhaar', label: 'Aadhaar Card', icon: ShieldCheck, description: 'Mandatory Address Proof' },
                    { id: 'voter_id', label: 'Voter ID', icon: User, description: 'Valid for Indians' },
                    { id: 'driving_license', label: 'Driving License', icon: Car, description: 'DL Authorities' },
                    { id: 'passport', label: 'Passport', icon: Globe, description: 'Indian Passport' }
                  ]}
                  value={formData.idType}
                  onChange={(val) => updateField('idType', val)}
                  label="ID Document Type"
                />
                <div className="field">
                  <label className="label">Last 4 Digits / ID No.</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="xxxx"
                    value={formData.idNumber}
                    onChange={(e) => updateField('idNumber', e.target.value)}
                  />
                  <p className="text-[10px] text-ink-muted italic mt-1">PAN Card is not accepted proof.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="field">
                  <label className="label">Passport Number*</label>
                  <input
                    type="text"
                    className="input font-mono uppercase"
                    placeholder="E1234567"
                    value={formData.passportNumber}
                    onChange={(e) => updateField('passportNumber', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Visa Number</label>
                  <input
                    type="text"
                    className="input font-mono"
                    placeholder="V123456"
                    value={formData.visaNumber}
                    onChange={(e) => updateField('visaNumber', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">India Arrival Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.arrivalDateIndia}
                    onChange={(e) => updateField('arrivalDateIndia', e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-accent font-semibold md:col-span-2 lg:col-span-3 bg-accent/5 p-3 rounded-lg border border-accent/20">
                  Form C submission is mandatory within 24 hours of arrival for international guests.
                </p>
              </div>
            )}
          </section>

          <div className="h-px w-full bg-border-subtle opacity-50 my-2" />

          {/* SECTION 4: ADVANCE & PAYMENT */}
          <section className="flex flex-col gap-6 animate-slide-up relative z-[10]" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-xs">4</div>
              <h2 className="text-lg font-display text-ink-primary font-medium">Advance & Payment</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="field">
                <label className="label">Room Rate (Per Night)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-mono">₹</span>
                  <input
                    type="number"
                    className="input pl-8 font-mono"
                    value={formData.pricePerNight}
                    onChange={(e) => updateField('pricePerNight', parseInt(e.target.value) || 0)}
                  />
                </div>
                <p className="text-[11px] text-ink-muted italic mt-1 ml-1">Default for {room.room_type} is {formatINR(room.base_price)}</p>
              </div>

              <div className="field">
                <label className="label">Collect Advance Payment</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-mono">₹</span>
                  <input
                    type="number"
                    className="input pl-8 font-mono bg-bg-surface text-xl border-accent shadow-sm"
                    placeholder={formData.advancePaid ? "" : "0"}
                    value={formData.advancePaid}
                    onChange={(e) => updateField('advancePaid', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {['cash', 'upi', 'card'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => updateField('paymentMethod', mode)}
                      className={`py-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider border transition-all ${formData.paymentMethod === mode
                          ? 'bg-accent text-white border-accent shadow-sm'
                          : 'bg-white text-ink-secondary border-border-subtle hover:bg-bg-sunken'
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field col-span-full border-t border-border-subtle pt-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.includeTax}
                      onChange={e => updateField('includeTax', e.target.checked)}
                    />
                    <div className="w-10 h-6 bg-border-subtle rounded-full peer-checked:bg-accent peer-checked:border-accent transition-all animate-none" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-ink-primary select-none group-hover:text-accent transition-colors">Add 12% GST to total</span>
                    <span className="text-[10px] text-ink-muted uppercase font-semibold tracking-widest">Tax Invoice required</span>
                  </div>
                </label>
              </div>
            </div>
          </section>

        </div>

        {/* Right: Consolidated Summary Card */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 md:p-8 flex flex-col gap-6 sticky top-24 shadow-md bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-bg-sunken flex items-center justify-center text-ink-primary font-display text-2xl border border-border-subtle">
                {room.room_number}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-sans font-semibold text-ink-muted uppercase tracking-wider">{room.room_type} ROOM</span>
                <span className="text-sm text-ink-primary font-display font-medium">Floor {room.floor} • {
                  room.property_id === '010' ? 'The Peace' : 
                  room.property_id === '011' ? 'Starry Nights' : 'Starry BnB'
                }</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-border-subtle/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink-muted">Guest</span>
                <div className="flex items-center gap-2">
                   <span className="text-xs">{formData.nationality === 'indian' ? '🇮🇳' : '🌎'}</span>
                   <div className="flex flex-col items-end">
                    <span className="text-ink-primary font-semibold">{formData.guestName || "—"}</span>
                    {(formData.numAdults > 1 || formData.numChildren > 0) && (
                      <span className="text-[10px] text-ink-muted">+{formData.numAdults + formData.numChildren - 1} extra guest(s)</span>
                    )}
                   </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink-muted">Occupancy</span>
                <div className="flex flex-col items-end">
                  <span className="text-ink-primary font-medium">{formData.numAdults} Ad, {formData.numChildren} Ch</span>
                  {formData.numInfants > 0 && <span className="text-[10px] text-success font-semibold">+{formData.numInfants} Infant(s)</span>}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink-muted">Stay</span>
                <div className="flex flex-col items-end">
                  <span className="text-ink-primary font-medium">{nights || 1} Night(s)</span>
                  <span className="text-[10px] text-ink-muted italic">Out: {formatDate(formData.checkOutDate)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 pt-4 border-t border-border-subtle/30">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-ink-muted">Total Amount</span>
                  <div className="flex flex-col items-end">
                    <span className="font-mono font-semibold text-ink-primary">{formatINR(totalAmount)}</span>
                    {formData.includeTax && <span className="text-[9px] font-semibold text-success uppercase">Inc. 12% GST</span>}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 mt-1 border-t border-border-subtle/10">
                  <span className="text-sm font-semibold text-ink-primary">Balance Due</span>
                  <span className="text-xl font-mono text-danger font-semibold">{formatINR(balanceDue)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!formData.guestName || !formData.guestPhone}
              className={`w-full py-4 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all shadow-lg mt-2 ${!formData.guestName || !formData.guestPhone ? 'bg-ink-disabled text-ink-muted cursor-not-allowed shadow-none' : 'btn-accent shadow-accent/20 hover:-translate-y-0.5 active:translate-y-0'
                }`}
            >
              <span>Complete Check-in</span>
              <ChevronRight size={18} />
            </button>
            <p className="text-[10px] text-center text-ink-muted italic px-4">By completing, the room status will change to <span className="text-success font-semibold uppercase">Occupied</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewCheckInPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Loading Check-in Form...</div>}>
      <BookingFlow />
    </Suspense>
  );
}
