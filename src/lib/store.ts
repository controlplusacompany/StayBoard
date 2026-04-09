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

export const APP_DEFAULT_ROOMS: Room[] = [
  // The Peace (010) - 8 Rooms
  { id: '010-101', property_id: '010', room_number: '101', room_type: 'double', status: 'vacant', base_price: 1500, floor: 1, max_occupancy: 2 },
  { id: '010-102', property_id: '010', room_number: '102', room_type: 'double', status: 'vacant', base_price: 1500, floor: 1, max_occupancy: 2 },
  { id: '010-201', property_id: '010', room_number: '201', room_type: 'deluxe', status: 'vacant', base_price: 2500, floor: 2, max_occupancy: 2 },
  { id: '010-202', property_id: '010', room_number: '202', room_type: 'deluxe', status: 'vacant', base_price: 2500, floor: 2, max_occupancy: 2 },
  { id: '010-203', property_id: '010', room_number: '203', room_type: 'deluxe', status: 'vacant', base_price: 2500, floor: 2, max_occupancy: 2 },
  { id: '010-301', property_id: '010', room_number: '301', room_type: 'suite', status: 'vacant', base_price: 3500, floor: 3, max_occupancy: 4 },
  { id: '010-302', property_id: '010', room_number: '302', room_type: 'suite', status: 'vacant', base_price: 3500, floor: 3, max_occupancy: 4 },
  { id: '010-303', property_id: '010', room_number: '303', room_type: 'suite', status: 'vacant', base_price: 3500, floor: 3, max_occupancy: 4 },

  // Starry Nights (011) - 6 Rooms
  { id: '011-1', property_id: '011', room_number: '1', room_type: 'dorm', status: 'vacant', base_price: 800, floor: 1, max_occupancy: 1 },
  { id: '011-2', property_id: '011', room_number: '2', room_type: 'dorm', status: 'vacant', base_price: 800, floor: 1, max_occupancy: 1 },
  { id: '011-3', property_id: '011', room_number: '3', room_type: 'private', status: 'vacant', base_price: 1800, floor: 2, max_occupancy: 2 },
  { id: '011-4', property_id: '011', room_number: '4', room_type: 'private', status: 'vacant', base_price: 1800, floor: 2, max_occupancy: 2 },
  { id: '011-5', property_id: '011', room_number: '5', room_type: 'private', status: 'vacant', base_price: 1800, floor: 2, max_occupancy: 2 },
  { id: '011-6', property_id: '011', room_number: '6', room_type: 'private', status: 'vacant', base_price: 1800, floor: 2, max_occupancy: 2 }
];

const MASTER_OWNER_ID = '00000000-0000-0000-0000-000000000000';

// CORE FETCHERS
export const getStoredRooms = async (defaultRooms: Room[] = APP_DEFAULT_ROOMS): Promise<Room[]> => {
  const { data, error } = await supabase.from('rooms').select('*').order('room_number');
  return error || !data || data.length === 0 ? defaultRooms : data as Room[];
};

export const getBookingsList = async (): Promise<Booking[]> => {
  const { data, error } = await supabase.from('bookings').select('*').order('check_in_date', { ascending: false });
  return error ? [] : data as Booking[];
};

export const getStoredBookings = async (fallback: any = {}): Promise<Record<string, Booking>> => {
  const list = await getBookingsList();
  const map: Record<string, Booking> = {};
  list.forEach(b => map[b.id] = b);
  return Object.keys(map).length > 0 ? map : fallback;
};

// ENRICHMENT (The magic that sets room colors)
export const getEnrichedRooms = async (defaultRooms: Room[] = APP_DEFAULT_ROOMS): Promise<Room[]> => {
  const rooms = await getStoredRooms(defaultRooms);
  const bookings = await getBookingsList();
  
  // Get Today in local timezone (India)
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localToday = new Date(now.getTime() - offset).toISOString().split('T')[0];

  return rooms.map(room => {
    // 1. ACTIVE OCCUPANCY: Must be "checked_in" AND occurring TODAY
    const currentGuest = bookings.find(b => 
      b.room_id === room.id && 
      b.status === 'checked_in' &&
      b.check_in_date.split('T')[0] <= localToday &&
      b.check_out_date.split('T')[0] > localToday
    );

    // 2. Scheduled logic
    const arrivingToday = bookings.find(b => 
      b.room_id === room.id && 
      b.status === 'confirmed' && 
      b.check_in_date.split('T')[0] === localToday
    );

    const checkoutToday = bookings.find(b => 
      b.room_id === room.id && 
      b.status === 'checked_in' && 
      b.check_out_date.split('T')[0] === localToday
    );

    // 3. NEXT FUTURE BOOKING (for Vacant Rooms)
    const futureBookings = bookings
      .filter(b => b.room_id === room.id && (b.status === 'confirmed' || b.status === 'issued') && b.check_in_date.split('T')[0] > localToday)
      .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date));
    
    const nextBooking = futureBookings[0];
    let futureBookingStr = '';
    
    if (nextBooking) {
      const d = new Date(nextBooking.check_in_date);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      futureBookingStr = `Next: ${d.getDate()} ${months[d.getMonth()]}`;
    }

    let calculatedStatus = room.status;

    if (currentGuest) {
      calculatedStatus = 'occupied';
    } else if (arrivingToday) {
      calculatedStatus = 'arriving_today';
    } else if (checkoutToday) {
      calculatedStatus = 'checkout_today';
    } else if (room.status === 'occupied') {
      // ONLY correct to vacant if it was occupied in DB but we see no active guest
      calculatedStatus = 'vacant';
    }
    // Note: If room.status is 'cleaning' or 'maintenance', it stays that way.

    return { 
      ...room, 
      status: calculatedStatus as RoomStatus,
      future_booking: futureBookingStr,
      guest_name: currentGuest?.guest_name || arrivingToday?.guest_name || '',
      checkout_date: currentGuest?.check_out_date || arrivingToday?.check_out_date || ''
    };
  });
};

// WRITE OPERATIONS
export const finalCheckout = async (bookingId: string, paymentAmount: number) => {
  // 1. Get the booking
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
  if (!booking) return;

  // 2. Update Booking Status
  await supabase.from('bookings').update({ 
    status: 'checked_out',
    amount_paid: (Number(booking.amount_paid) || 0) + paymentAmount
  }).eq('id', bookingId);

  // 3. Find and update the invoice
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

export const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
  const { data: booking, error: fetchErr } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
  if (fetchErr || !booking) return;

  const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
  if (error) throw error;
  
  // SYNC GUEST: Ensure guest info is always up to date on status change
  await syncGuestFromBooking({ ...booking, status });

  if (status === 'checked_in') await updateRoomStatus(booking.room_id, 'occupied');
  if (status === 'checked_out') await updateRoomStatus(booking.room_id, 'vacant');
  
  window.dispatchEvent(new Event('storage'));
};

export const addBooking = async (booking: Booking) => {
  const { data, error } = await supabase.from('bookings').insert([{ ...booking, owner_id: MASTER_OWNER_ID }]).select();
  if (error) throw error;

  // Auto-Update Room
  if (booking.status === 'checked_in') await updateRoomStatus(booking.room_id, 'occupied');
  
  // Create Initial Invoice
  await addInvoice({
    id: `inv-${Date.now()}`,
    booking_id: booking.id,
    property_id: booking.property_id,
    owner_id: MASTER_OWNER_ID,
    invoice_number: `SB-${Math.floor(1000 + Math.random() * 9000)}`,
    amount_total: Number(booking.total_amount),
    amount_paid: Number(booking.amount_paid) || 0,
    status: (Number(booking.amount_paid) >= Number(booking.total_amount)) ? 'paid' : 'issued',
    created_at: new Date().toISOString(),
    due_date: booking.check_out_date
  });

  // Create Guest if not exists
  await syncGuestFromBooking(booking);

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
  const { data } = await supabase.from('guests').select('*').order('name');
  const guests = (data as Guest[]) || [];
  
  // SELF-HEALING: If directory is empty but we have bookings, rebuild it!
  if (guests.length === 0) {
    const bookings = await getBookingsList();
    if (bookings.length > 0) {
      for (const b of bookings) {
        await syncGuestFromBooking(b);
      }
      const { data: refreshed } = await supabase.from('guests').select('*').order('name');
      return (refreshed as Guest[]) || [];
    }
  }
  
  return guests;
};

export const syncGuestFromBooking = async (booking: Booking) => {
  const { data: existing } = await supabase.from('guests').select('*').eq('phone', booking.guest_phone).single();
  
  const guestData = {
    name: booking.guest_name,
    phone: booking.guest_phone,
    id_number: booking.guest_id_number,
    id_type: booking.guest_id_type,
    last_stay_date: booking.check_in_date,
    updated_at: new Date().toISOString()
  };

  if (existing) {
    await supabase.from('guests').update({
      ...guestData,
      total_spent: Number(existing.total_spent) + Number(booking.total_amount),
      total_stays: Number(existing.total_stays) + 1
    }).eq('id', existing.id);
  } else {
    await supabase.from('guests').insert([{
      ...guestData,
      id: `g-${Date.now()}`,
      owner_id: MASTER_OWNER_ID,
      total_spent: booking.total_amount,
      total_stays: 1,
      is_vip: false,
      created_at: new Date().toISOString()
    }]);
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
  const { data, error } = await supabase.from('rate_rules').insert([{ ...rule, owner_id: MASTER_OWNER_ID }]).select();
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

export const getAvailableRoomTypeCount = async (propertyId: string, type: string, from: string, to: string) => {
  const rooms = await getStoredRooms();
  const typeRooms = rooms.filter(r => r.property_id === propertyId && r.room_type === type);
  const bookings = await getBookingsList();
  const conflict = bookings.filter(b => b.property_id === propertyId && b.status !== 'cancelled' && from < b.check_out_date && to > b.check_in_date);
  return typeRooms.length - conflict.length;
};

export const getVacantRooms = async (propertyId?: string): Promise<Room[]> => {
  const enriched = await getEnrichedRooms();
  return enriched.filter(r => r.status === 'vacant' && (!propertyId || r.property_id === propertyId));
};
