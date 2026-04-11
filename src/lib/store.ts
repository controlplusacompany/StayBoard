import { 
  Room, 
  RoomStatus, 
  Booking, 
  HousekeepingTask, 
  TaskType, 
  TaskStatus, 
  TaskPriority,
  Invoice,
  InvoiceStatus,
  PaymentEntry,
  PaymentMethod,
  Guest,
  RateRule
} from '@/types';
import { supabase } from './supabase';

// NATIVE CLOUD STORE - SOURCE OF TRUTH: SUPABASE
// --------------------------------------------------

export const getCurrentUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || '00000000-0000-0000-0000-000000000000';
};

export const logout = async () => {
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('stayboard_user_role');
    localStorage.removeItem('stayboard_user_email');
    localStorage.removeItem('stayboard_user_property');
    // Clear cookies
    document.cookie = "sb_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "sb_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = '/login';
  }
};

// GLOBAL FILTERS (Stored in LocalStorage for persistence)
export const getSelectedProperty = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('stayboard_master_property');
};

export const setSelectedProperty = (propertyId: string | null) => {
  if (typeof window === 'undefined') return;
  if (propertyId) {
    localStorage.setItem('stayboard_master_property', propertyId);
  } else {
    localStorage.removeItem('stayboard_master_property');
  }
  // Broadcast change for other components/tabs
  window.dispatchEvent(new Event('storage'));
};

export const getStoredRooms = async (): Promise<Room[]> => {
  const { data, error } = await supabase.from('rooms').select('*').order('room_number');
  if (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
  return (data as Room[]) || [];
};

export const getBookingsList = async (): Promise<Booking[]> => {
  const { data, error } = await supabase.from('bookings').select('*').order('check_in_date', { ascending: false });
  return error ? [] : data as Booking[];
};

export const getStoredBookings = async (): Promise<Record<string, Booking>> => {
  const list = await getBookingsList();
  const map: Record<string, Booking> = {};
  list.forEach(b => map[b.id] = b);
  return map;
};

// ENRICHMENT (The magic that sets room colors)
export const getEnrichedRooms = async (): Promise<Room[]> => {
  const rooms = await getStoredRooms();
  const bookings = await getBookingsList();
  
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localToday = new Date(now.getTime() - offset).toISOString().split('T')[0];

  return rooms.map(room => {
    // 1. ACTIVE OCCUPANCY: status === 'checked_in'
    const currentGuest = bookings.find(b => 
      b.room_id === room.id && 
      b.status === 'checked_in' &&
      b.check_in_date.split('T')[0] <= localToday &&
      b.check_out_date.split('T')[0] > localToday
    );

    // 2. Scheduled logic
    const arrivingToday = bookings.find(b => 
      b.room_id === room.id && 
      (b.status === 'assigned' || b.status === 'unassigned') && 
      b.check_in_date.split('T')[0] === localToday
    );

    const checkoutToday = bookings.find(b => 
      b.room_id === room.id && 
      b.status === 'checked_in' && 
      b.check_out_date.split('T')[0] === localToday
    );

    // 3. OVERDUE check
    const isOverdue = !!(currentGuest && currentGuest.check_out_date.split('T')[0] < localToday);

    // 4. NEXT FUTURE BOOKING
    const futureBookings = bookings
      .filter(b => 
        b.room_id === room.id && 
        ['assigned', 'unassigned'].includes(b.status) && 
        b.check_in_date.split('T')[0] >= localToday &&
        b.id !== arrivingToday?.id
      )
      .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date));
    
    let futureBookingStr = '';
    const nextBooking = futureBookings[0];
    
    if (nextBooking) {
      const d = parseISO(nextBooking.check_in_date);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      futureBookingStr = `Next: ${d.getDate()} ${months[d.getMonth()]} (${nextBooking.guest_name})`;
    }

    let calculatedStatus = room.status;

    if (currentGuest) {
      calculatedStatus = 'occupied';
    } else if (arrivingToday) {
      calculatedStatus = 'arriving_today';
    } else if (checkoutToday) {
      calculatedStatus = 'checkout_today';
    } else if (room.status === 'occupied') {
      calculatedStatus = 'vacant';
    }

    return { 
      ...room, 
      status: calculatedStatus as RoomStatus,
      is_overdue: isOverdue,
      future_booking: futureBookingStr,
      guest_name: currentGuest?.guest_name || arrivingToday?.guest_name || checkoutToday?.guest_name || '',
      checkout_date: currentGuest?.check_out_date || arrivingToday?.check_out_date || checkoutToday?.check_out_date || ''
    };
  });
};

// WRITE OPERATIONS
export const finalCheckout = async (bookingId: string, paymentAmount: number, paymentMode: string = 'UPI', notes: string = '') => {
  // 1. Get the booking
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
  if (!booking) return;

  // 2. Update Booking Status & Actual Checkout Date
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localToday = new Date(now.getTime() - offset).toISOString().split('T')[0];

  await supabase.from('bookings').update({ 
    status: 'checked_out',
    check_out_date: localToday, 
    amount_paid: (Number(booking.amount_paid) || 0) + paymentAmount
  }).eq('id', bookingId);

  // 3. Log management audit trail
  await logActivity(bookingId, 'CHECKOUT', {
    final_settlement: paymentAmount,
    mode: paymentMode,
    internal_notes: notes,
    timestamp: new Date().toISOString(),
    guest: booking.guest_name
  });

  // 4. Find and update the invoice
  const { data: invoice } = await supabase.from('invoices').select('*').eq('booking_id', bookingId).single();
  if (invoice) {
    const newPaid = (Number(invoice.amount_paid) || 0) + paymentAmount;
    await supabase.from('invoices').update({
      amount_paid: newPaid,
      status: newPaid >= Number(invoice.amount_total) ? 'paid' : 'partially_paid'
    }).eq('id', invoice.id);
  }

  // 4. Set Room to CLEANING (not vacant yet!)
  await updateRoomStatus(booking.room_id, 'cleaning');

  // 5. Sync Guest history
  await syncGuestFromBooking({ ...booking, status: 'checked_out' });

  window.dispatchEvent(new Event('storage'));
};

export const getBookingById = async (id: string): Promise<Booking | null> => {
  const { data } = await supabase.from('bookings').select('*').eq('id', id).single();
  return data;
};

export const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
  const { data: booking, error: fetchErr } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
  if (fetchErr || !booking) return;

  const updateData: any = { status };
  if (status === 'checked_out') {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localToday = new Date(now.getTime() - offset).toISOString().split('T')[0];
    updateData.check_out_date = localToday;
  }

  const { error } = await supabase.from('bookings').update(updateData).eq('id', bookingId);
  if (error) throw error;
  
  // SYNC GUEST: Ensure guest info is always up to date on status change
  await syncGuestFromBooking({ ...booking, status });

  if (status === 'checked_in') await updateRoomStatus(booking.room_id, 'occupied');
  if (status === 'checked_out') await updateRoomStatus(booking.room_id, 'vacant');
  
  window.dispatchEvent(new Event('storage'));
};

export const logActivity = async (bookingId: string, action: string, details: any) => {
  try {
    await supabase.from('booking_activities').insert({
      booking_id: bookingId,
      action,
      details,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

export const updateBooking = async (bookingId: string, updates: Partial<Booking>) => {
  // 0. Fetch pre-update state for logging
  const { data: oldBooking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();

  const { error } = await supabase.from('bookings').update(updates).eq('id', bookingId);
  if (error) throw error;
  
  // 1. Sync Guest info if guest details changed
  if (updates.guest_name || updates.guest_phone || updates.status) {
    if (oldBooking) await syncGuestFromBooking({ ...oldBooking, ...updates });
  }

  // 2. Sync Invoice if financial details changed
  if (updates.amount_paid !== undefined || updates.total_amount !== undefined) {
    const { data: invoice } = await supabase.from('invoices').select('*').eq('booking_id', bookingId).single();
    if (invoice) {
      const invoiceUpdates: any = {};
      if (updates.total_amount !== undefined) invoiceUpdates.amount_total = updates.total_amount;
      if (updates.amount_paid !== undefined) invoiceUpdates.amount_paid = updates.amount_paid;
      
      // Update status based on new numbers
      const finalTotal = updates.total_amount ?? invoice.amount_total;
      const finalPaid = updates.amount_paid ?? invoice.amount_paid;
      invoiceUpdates.status = finalPaid >= finalTotal ? 'paid' : (finalPaid > 0 ? 'partially_paid' : 'pending');

      await supabase.from('invoices').update(invoiceUpdates).eq('id', invoice.id);
    }
  }

  // 3. Log the activity
  if (oldBooking) {
    const changedFields: any = {};
    Object.keys(updates).forEach(key => {
      if ((updates as any)[key] !== (oldBooking as any)[key]) {
        changedFields[key] = {
          from: (oldBooking as any)[key],
          to: (updates as any)[key]
        };
      }
    });
    
    if (Object.keys(changedFields).length > 0) {
      await logActivity(bookingId, updates.check_out_date && updates.check_out_date !== oldBooking.check_out_date ? 'EXTENSION' : 'UPDATE', changedFields);
    }
  }

  // 4. Update room status if status changed
  if (updates.status === 'checked_in' && updates.room_id) await updateRoomStatus(updates.room_id, 'occupied');
  if (updates.status === 'checked_out' && updates.room_id) await updateRoomStatus(updates.room_id, 'vacant');

  window.dispatchEvent(new Event('storage'));
};

export const addBooking = async (booking: Booking) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from('bookings').insert([{ ...booking, owner_id: userId }]).select();
  if (error) throw error;

  // Auto-Update Room for Walk-ins
  if (booking.status === 'checked_in' && booking.room_id) {
    await updateRoomStatus(booking.room_id, 'occupied');
  }
  
  // Create Initial Invoice
  await addInvoice({
    id: `inv-${Date.now()}`,
    booking_id: booking.id,
    property_id: booking.property_id,
    owner_id: userId,
    invoice_number: `SB-${Math.floor(1000 + Math.random() * 9000)}`,
    amount_total: Number(booking.total_amount),
    amount_paid: 0,
    status: 'pending'
  });

  // Sync Guest (Non-blocking)
  try {
    await syncGuestFromBooking(booking);
  } catch (err) {
    console.error("Guest Sync Failed during booking save:", err);
  }

  window.dispatchEvent(new Event('storage'));
  return data;
};


export const updateRoomStatus = async (roomId: string, status: RoomStatus) => {
  const { data } = await supabase.from('rooms').update({ status, updated_at: new Date().toISOString() }).eq('id', roomId).select();
  window.dispatchEvent(new Event('storage'));
  return data;
};

// GUESTS & PAYMENTS
export const getStoredGuests = async (): Promise<Guest[]> => {
  console.log('Fetching guests from Supabase...');
  const { data, error } = await supabase.from('guests').select('*').order('name');
  if (error) {
    console.error('CRITICAL: Error fetching guests:', error);
    return [];
  }
  
  let guests = (data as Guest[]) || [];
  console.log(`Initial guest count: ${guests.length}`);
  
  // SELF-HEALING: If directory is empty but we have bookings, rebuild it!
  if (guests.length === 0) {
    console.log('GUEST DIRECTORY EMPTY - TRIGGERING HEALING...');
    const { data: bookingsRaw, error: bError } = await supabase.from('bookings').select('*');
    if (bError) {
      console.error('HEAL FAIL: Could not fetch bookings:', bError);
      return [];
    }
    
    if (bookingsRaw && bookingsRaw.length > 0) {
      console.log(`HEALING: Attempting to rebuild ${bookingsRaw.length} guests from bookings...`);
      // Use sequential for-of to avoid hammering Supabase and to handle errors better
      for (const b of bookingsRaw) {
        try {
          await syncGuestFromBooking(b);
        } catch (syncErr) {
          console.error(`HEAL FAIL: Sync for booking ${b.id} failed:`, syncErr);
        }
      }
      
      const { data: refreshed, error: rError } = await supabase.from('guests').select('*').order('name');
      if (rError) {
        console.error('HEAL FAIL: Refetch after sync failed:', rError);
        return [];
      }
      return (refreshed as Guest[]) || [];
    }
  }
  
  return guests;
};

export const syncGuestFromBooking = async (booking: Booking) => {
  try {
    // Use .select() instead of .single() to avoid error noise if not found
    const { data: existingList, error: qError } = await supabase.from('guests').select('*').eq('phone', booking.guest_phone);
    if (qError) throw qError;
    
    const existing = existingList && existingList.length > 0 ? existingList[0] : null;
    
    const guestData: any = {
      name: booking.guest_name,
      phone: booking.guest_phone,
      last_stay_date: booking.check_in_date
    };

    if (existing) {
      console.log(`Updating existing guest: ${booking.guest_name}`);
      const { error: uError } = await supabase.from('guests').update(guestData).eq('id', existing.id);
      if (uError) console.error(`Failed to update guest ${booking.guest_name}:`, uError);
    } else {
      console.log(`Creating new guest record: ${booking.guest_name}`);
      const userId = await getCurrentUserId();
      const { error: iError } = await supabase.from('guests').insert([{
        ...guestData,
        owner_id: userId
      }]);
      if (iError) console.error(`Failed to insert guest ${booking.guest_name}:`, iError);
      else console.log(`Successfully created guest: ${booking.guest_name}`);
    }
  } catch (err) {
    console.error("syncGuestFromBooking failed:", err);
  }
};

export const toggleVipStatus = async (guestId: string) => {
  const { data: guest } = await supabase.from('guests').select('is_vip').eq('id', guestId).single();
  if (guest) {
    await supabase.from('guests').update({ is_vip: !guest.is_vip }).eq('id', guestId);
    window.dispatchEvent(new Event('storage'));
  }
};

// INVOICES & PAYMENTS
export const getStoredInvoices = async (): Promise<Invoice[]> => {
  const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
  return (data as Invoice[]) || [];
};

export const addInvoice = async (invoice: Invoice) => {
  await supabase.from('invoices').insert([invoice]);
};

export const processPayment = async (invoiceId: string, amount: number, method: string) => {
  const { data: inv } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
  if (inv) {
    const newPaid = Number(inv.amount_paid) + amount;
    const newStatus = newPaid >= Number(inv.amount_total) ? 'paid' : 'partially_paid';
    await supabase.from('invoices').update({ amount_paid: newPaid, status: newStatus }).eq('id', invoiceId);
    window.dispatchEvent(new Event('storage'));
  }
};

// HOUSEKEEPING
export const getStoredTasks = async (): Promise<HousekeepingTask[]> => {
  const { data } = await supabase.from('housekeeping_tasks').select('*').order('created_at', { ascending: false });
  return (data as HousekeepingTask[]) || [];
};

export const addTask = async (task: any) => {
  await supabase.from('housekeeping_tasks').insert([task]);
  window.dispatchEvent(new Event('storage'));
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
  const update: any = { status };
  if (status === 'in_progress') update.started_at = new Date().toISOString();
  if (status === 'completed') update.completed_at = new Date().toISOString();
  await supabase.from('housekeeping_tasks').update(update).eq('id', taskId);
  window.dispatchEvent(new Event('storage'));
};

export const reassignTask = async (taskId: string, staffName: string) => {
  await supabase.from('housekeeping_tasks').update({ assigned_to: staffName }).eq('id', taskId);
  window.dispatchEvent(new Event('storage'));
};

// RATES & RULES
export const getStoredRateRules = async (): Promise<RateRule[]> => {
  const { data } = await supabase.from('rate_rules').select('*').order('created_at', { ascending: false });
  return (data as RateRule[]) || [];
};

export const addRateRule = async (rule: any) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from('rate_rules').insert([{ ...rule, owner_id: userId }]).select();
  if (error) throw error;
  window.dispatchEvent(new Event('storage'));
  return data;
};

export const deleteRateRule = async (ruleId: string) => {
  await supabase.from('rate_rules').delete().eq('id', ruleId);
  window.dispatchEvent(new Event('storage'));
};

// HELPER: Search Guests
export const searchGuests = async (query: string): Promise<Guest[]> => {
  const { data } = await supabase
    .from('guests')
    .select('*')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(5);
  return (data as Guest[]) || [];
};

export const getBookingsForRoom = async (roomId: string): Promise<Booking[]> => {
  const { data } = await supabase.from('bookings').select('*').eq('room_id', roomId).neq('status', 'cancelled');
  return (data as Booking[]) || [];
};

export const getRoomBlockedDates = async (roomId: string): Promise<string[]> => {
  const bookings = await getBookingsForRoom(roomId);
  const blockedDates: string[] = [];
  
  bookings.forEach(b => {
    // If the guest is in the room or confirmed, block those dates
    if (b.status !== 'cancelled' && b.status !== 'checked_out') {
      const start = new Date(b.check_in_date);
      const end = new Date(b.check_out_date);
      
      // Add every date from start to end (exclusive of end date for check-out morning)
      let current = new Date(start);
      while (current < end) {
        blockedDates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    }
  });
  
  return [...new Set(blockedDates)]; // Return unique dates
};

export const getAvailableRoomCount = async (propertyId: string, from: string, to: string) => {
  const rooms = await getStoredRooms();
  const propertyRooms = rooms.filter(r => r.property_id === propertyId);
  
  const fromDay = from.split('T')[0];
  const toDay = to.split('T')[0];
  
  const bookings = await getBookingsList();
  
  const conflict = bookings.filter(b => {
    if (b.property_id !== propertyId) return false;
    if (['cancelled', 'checked_out'].includes(b.status)) return false;
    
    const bStart = b.check_in_date.split('T')[0];
    const bEnd = b.check_out_date.split('T')[0];
    
    return fromDay < bEnd && toDay > bStart;
  });
  
  return propertyRooms.length - conflict.length;
};

export const getArrivalsToday = async (propertyId?: string): Promise<Booking[]> => {
  const bookings = await getBookingsList();
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localToday = new Date(now.getTime() - offset).toISOString().split('T')[0];

  return bookings.filter(b => 
    (!propertyId || b.property_id === propertyId) &&
    ['unassigned', 'assigned'].includes(b.status) &&
    b.check_in_date.split('T')[0] === localToday
  );
};

export const getVacantRooms = async (propertyId?: string): Promise<Room[]> => {
  const enriched = await getEnrichedRooms();
  // Allow picking Vacant OR Cleaning rooms for new bookings to enable same-day turnover
  return enriched.filter(r => (r.status === 'vacant' || r.status === 'cleaning') && (!propertyId || r.property_id === propertyId));
};

export const getStoredProperties = async () => {
  const { data } = await supabase.from('properties').select('*').order('name');
  return data || [];
};

export const shiftRoom = async (bookingId: string, sourceRoomId: string, targetRoomId: string) => {
  // 1. Update Booking
  await supabase.from('bookings').update({ room_id: targetRoomId }).eq('id', bookingId);
  
  // 2. Mark old room for cleaning
  await updateRoomStatus(sourceRoomId, 'cleaning');
  
  // 3. Mark new room occupied
  await updateRoomStatus(targetRoomId, 'occupied');
  
  window.dispatchEvent(new Event('storage'));
};
