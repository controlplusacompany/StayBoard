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

// This is a simple client-side store using localStorage for the demo/MVP.
// In a real app, this would be replaced by actual API calls to a database.

const STORAGE_KEYS = {
  ROOMS: 'stayboard_rooms',
  BOOKINGS: 'stayboard_bookings',
  TASKS: 'stayboard_tasks',
  INVOICES: 'stayboard_invoices',
  GUESTS: 'stayboard_guests',
  RATES: 'stayboard_rates',
};

export const getStoredRooms = async (defaultRooms: Room[] = []): Promise<Room[]> => {
  // Use Supabase as primary source
  const { data, error } = await supabase
    .from('rooms')
    .select('*');

  if (error) {
    console.error('Error fetching rooms from Supabase:', error);
    // Fallback to localStorage for development/local demo
    if (typeof window === 'undefined') return defaultRooms;
    const stored = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return stored ? JSON.parse(stored) : defaultRooms;
  }

  return (data as Room[]) || defaultRooms;
};

export const updateRoomStatus = async (roomId: string, status: RoomStatus) => {
  const { data, error } = await supabase
    .from('rooms')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', roomId)
    .select();

  if (error) {
    console.error('Error updating room status in Supabase:', error);
    // Local fallback
    const rooms = await getStoredRooms([]);
    const updatedRooms = rooms.map(room =>
      room.id === roomId ? { ...room, status, updated_at: new Date().toISOString() } : room
    );
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(updatedRooms));
    return updatedRooms;
  }

  window.dispatchEvent(new Event('storage'));
  return data;
};

export const getStoredBookings = async (defaultBookings: Record<string, Booking> = {}): Promise<Record<string, Booking>> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*');

  if (error) {
    console.error('Error fetching bookings from Supabase:', error);
    if (typeof window === 'undefined') return defaultBookings;
    const stored = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return stored ? JSON.parse(stored) : defaultBookings;
  }

  const bookingsMap: Record<string, Booking> = {};
  data?.forEach(b => {
    bookingsMap[b.id] = b as Booking;
  });
  return bookingsMap;
};

export const getBookingsList = async (): Promise<Booking[]> => {
  const bookings = await getStoredBookings();
  return Object.values(bookings);
};

export const getBookingsForRoom = async (roomId: string): Promise<Booking[]> => {
  const list = await getBookingsList();
  return list.filter(b => b.room_id === roomId && b.status !== 'cancelled' && b.status !== 'no_show');
};

export const getEnrichedRooms = async (defaultRooms: Room[] = []): Promise<Room[]> => {
  const rooms = await getStoredRooms(defaultRooms);
  const bookings = await getBookingsList();
  
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localToday = new Date(now.getTime() - offset).toISOString().split('T')[0];

  return rooms.map(room => {
    const roomBookings = bookings.filter(b => b.room_id === room.id && b.status !== 'cancelled' && b.status !== 'no_show' && b.status !== 'checked_out');

    let newStatus = room.status;

    // Check if there is an active booking today
    const activeBooking = roomBookings.find(b => {
      const bStartStr = b.check_in_date.split('T')[0];
      const bEndStr = b.check_out_date.split('T')[0];
      return bStartStr <= localToday && bEndStr > localToday;
    });

    // Check if arriving today
    const arrivingToday = roomBookings.find(b => {
      const bStartStr = b.check_in_date.split('T')[0];
      return bStartStr === localToday;
    });

    // Check if checking out today (and not already checked out)
    const checkoutToday = roomBookings.find(b => {
      const bEndStr = b.check_out_date.split('T')[0];
      return bEndStr === localToday;
    });

    if (activeBooking) {
      newStatus = 'occupied';
    } else if (arrivingToday) {
      newStatus = 'arriving_today';
    } else if (checkoutToday) {
      newStatus = 'checkout_today';
    } else if (room.status === 'occupied') {
      newStatus = 'vacant';
    }

    return { ...room, status: newStatus as RoomStatus };
  });
};

export const getStoredTasks = async (): Promise<HousekeepingTask[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*');

  if (error) {
    console.error('Error fetching tasks from Supabase:', error);
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    return stored ? JSON.parse(stored) : [];
  }

  return (data as HousekeepingTask[]) || [];
};

export const addTask = async (task: Omit<HousekeepingTask, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ ...task, created_at: new Date().toISOString() }])
    .select();

  if (error) {
    console.error('Error adding task to Supabase:', error);
    const tasks = await getStoredTasks();
    const newTask: HousekeepingTask = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    const updatedTasks = [...tasks, newTask];
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
    return updatedTasks;
  }
  return data;
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus, startedAt?: string, completedAt?: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .update({ 
        status, 
        started_at: startedAt, 
        completed_at: completedAt 
    })
    .eq('id', taskId)
    .select();

  if (error) {
    console.error('Error updating task status:', error);
    const tasks = await getStoredTasks();
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status, started_at: startedAt || task.started_at, completed_at: completedAt || task.completed_at } : task
    );
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
    return updatedTasks;
  }
  window.dispatchEvent(new Event('storage'));
  return data;
};

export const reassignTask = async (taskId: string, assignedTo: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .update({ assigned_to: assignedTo })
    .eq('id', taskId)
    .select();

  if (error) {
    console.error('Error reassigning task:', error);
    const tasks = await getStoredTasks();
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, assigned_to: assignedTo } : task
    );
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
    return updatedTasks;
  }
  return data;
};

export const getStoredInvoices = async (): Promise<Record<string, Invoice>> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*');

  if (error) {
    console.error('Error fetching invoices:', error);
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return stored ? JSON.parse(stored) : {};
  }

  const map: Record<string, Invoice> = {};
  data?.forEach(inv => { map[inv.id] = inv as Invoice; });
  return map;
};

export const addInvoice = async (invoiceBase: Omit<Invoice, 'id' | 'created_at' | 'payments' | 'status' | 'amount_paid' | 'invoice_number'>) => {
  const invoice_number = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const { data, error } = await supabase
    .from('invoices')
    .insert([{ 
        ...invoiceBase, 
        invoice_number, 
        amount_paid: 0, 
        status: 'issued', 
        created_at: new Date().toISOString() 
    }])
    .select();

  if (error) {
    console.error('Error adding invoice:', error);
    // Local fallback
  }
  return data;
};

export const processPayment = async (invoiceId: string, amount: number, method: PaymentMethod) => {
  const invoices = await getStoredInvoices();
  const invoice = invoices[invoiceId];
  if (!invoice) return invoices;

  // Insert payment into Supabase
  const paymentData = {
    invoice_id: invoiceId,
    amount,
    method,
    created_at: new Date().toISOString()
  };

  const { data: payData, error: payError } = await supabase
    .from('payments')
    .insert([paymentData])
    .select();

  if (payError) {
    console.error('Error processing payment:', payError);
    return invoices;
  }

  const newAmountPaid = invoice.amount_paid + amount;
  let newStatus: InvoiceStatus = invoice.status;
  if (newAmountPaid > 0 && newAmountPaid < invoice.amount_total) {
    newStatus = 'partially_paid';
  } else if (newAmountPaid >= invoice.amount_total) {
    newStatus = 'paid';
  }

  // Update Invoice in Supabase
  await supabase
    .from('invoices')
    .update({ 
      amount_paid: newAmountPaid, 
      status: newStatus 
    })
    .eq('id', invoiceId);

  return payData;
};

export const getStoredGuests = async (): Promise<Record<string, Guest>> => {
  const { data, error } = await supabase
    .from('guests')
    .select('*');

  if (error) {
    console.error('Error fetching guests:', error);
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(STORAGE_KEYS.GUESTS);
    return stored ? JSON.parse(stored) : {};
  }

  const map: Record<string, Guest> = {};
  data?.forEach(g => { map[g.id] = g as Guest; });
  return map;
};

export const getStoredRateRules = async (): Promise<Record<string, RateRule>> => {
  const { data, error } = await supabase
    .from('rate_rules')
    .select('*');

  if (error) {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(STORAGE_KEYS.RATES);
    return stored ? JSON.parse(stored) : {};
  }

  const map: Record<string, RateRule> = {};
  data?.forEach(r => { map[r.id] = r as RateRule; });
  return map;
};

export const addRateRule = async (rule: Omit<RateRule, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('rate_rules')
    .insert([{ ...rule, created_at: new Date().toISOString() }])
    .select();

  return data;
};

export const deleteRateRule = async (id: string) => {
  await supabase
    .from('rate_rules')
    .delete()
    .eq('id', id);
};


export const addBooking = async (booking: Booking) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert([booking])
    .select();

  if (error) {
    console.error('Error adding booking to Supabase:', error);
  }

  // Update room status
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localTodayStr = new Date(now.getTime() - offset).toISOString().split('T')[0];
  const bookingStartStr = booking.check_in_date.split('T')[0];
  const bookingEndStr = booking.check_out_date.split('T')[0];
  
  if (bookingStartStr <= localTodayStr && bookingEndStr > localTodayStr && booking.room_id) {
    await updateRoomStatus(booking.room_id, 'occupied');
  }

  // AUTO-CREATE TASKS
  if (booking.room_id) {
    const checkoutTime = new Date(booking.check_out_date);
    checkoutTime.setHours(11, 0, 0, 0);

    await addTask({
      room_id: booking.room_id,
      property_id: booking.property_id,
      owner_id: booking.owner_id,
      task_type: 'checkout_clean',
      status: 'pending',
      priority: 'normal',
      due_by: checkoutTime.toISOString(),
    });
  }

  // AUTO-GENERATE INVOICE
  await addInvoice({
    booking_id: booking.id,
    owner_id: booking.owner_id,
    amount_total: booking.total_amount,
    due_date: booking.check_out_date
  });

  window.dispatchEvent(new Event('storage'));
  return data;
};




export const collectPayment = async (bookingId: string, amount: number) => {
  const bookings = await getStoredBookings({});
  const booking = bookings[bookingId];
  if (booking) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ amount_paid: (booking.amount_paid || 0) + amount })
      .eq('id', bookingId)
      .select();
    
    if (error) console.error('Error collecting payment:', error);
    return data;
  }
  return null;
};

export const checkOutGuest = async (bookingId: string) => {
  const bookings = await getStoredBookings({});
  const booking = bookings[bookingId];
  if (booking) {
    // 1. Mark booking as checked_out
    await supabase
      .from('bookings')
      .update({ status: 'checked_out' })
      .eq('id', bookingId);

    // 2. Mark room as cleaning
    if (booking.room_id) {
       await updateRoomStatus(booking.room_id, 'cleaning');
    }

    window.dispatchEvent(new Event('storage'));
  }
};

export const finalCheckout = async (bookingId: string, payAmount: number, discountAmount: number) => {
  const bookings = await getStoredBookings({});
  if (bookings[bookingId]) {
    const booking = bookings[bookingId];
    
    // Update booking in Supabase
    await supabase
      .from('bookings')
      .update({ 
        amount_paid: (booking.amount_paid || 0) + payAmount,
        total_amount: (booking.total_amount || 0) - discountAmount,
        status: 'checked_out'
      })
      .eq('id', bookingId);
    
    // Mark room as cleaning
    if (booking.room_id) {
      await updateRoomStatus(booking.room_id, 'cleaning');
    }
    window.dispatchEvent(new Event('storage'));
  }
};

export const updateStaffNotes = async (roomId: string, notes: string) => {
  const { data, error } = await supabase
    .from('rooms')
    .update({ staff_notes: notes })
    .eq('id', roomId)
    .select();

  if (error) {
    console.error('Error updating staff notes:', error);
    const rooms = await getStoredRooms([]);
    const updatedRooms = rooms.map(room =>
      room.id === roomId ? { ...room, staff_notes: notes } : room
    );
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(updatedRooms));
    return updatedRooms;
  }
  return data;
};

export const shiftRoom = async (bookingId: string, oldRoomId: string, newRoomId: string) => {
  const bookings = await getStoredBookings();
  const rooms = await getStoredRooms([]);
  const booking = bookings[bookingId];
  if (!booking) return;

  const newRoom = rooms.find(r => r.id === newRoomId);

  // 1. Update Booking in Supabase
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ 
        room_id: newRoomId,
        room_type: newRoom?.room_type || booking.room_type 
    })
    .eq('id', bookingId);

  if (bookingError) {
    console.error('Error shifting room in booking:', bookingError);
    return;
  }

  // 2. Update Old Room to cleaning
  await updateRoomStatus(oldRoomId, 'cleaning');
  
  // 3. Update New Room to occupied
  await updateRoomStatus(newRoomId, 'occupied');

  // 4. Update Tasks (move pending tasks to new room)
  const { error: taskError } = await supabase
    .from('tasks')
    .update({ room_id: newRoomId })
    .eq('room_id', oldRoomId)
    .eq('status', 'pending');

  if (taskError) {
    console.error('Error updating tasks for room shift:', taskError);
  }

  window.dispatchEvent(new Event('storage'));
};

export const getVacantRooms = async (propertyId?: string): Promise<Room[]> => {
  const rooms = await getStoredRooms([]);
  const bookings = await getBookingsList();
  
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localTodayStr = new Date(now.getTime() - offset).toISOString().split('T')[0];
  
  return rooms.filter(room => {
    // Basic status check
    if (room.status === 'cleaning' || room.status === 'maintenance') return false;
    
    // Property check if provided
    if (propertyId && room.property_id !== propertyId) return false;
    
    // Detailed booking check (no overlapping bookings for today)
    const roomBookings = bookings.filter(b => b.room_id === room.id && b.status !== 'cancelled' && b.status !== 'no_show' && b.status !== 'checked_out');
    const hasConflict = roomBookings.some(b => {
      const bStartStr = b.check_in_date.split('T')[0];
      const bEndStr = b.check_out_date.split('T')[0];
      return (localTodayStr >= bStartStr && localTodayStr < bEndStr);
    });
    
    return !hasConflict;
  });
};

export const getAvailableRoomTypeCount = async (propertyId: string, roomType: string, startDate: string, endDate: string) => {
  const rooms = await getStoredRooms([]);
  const propertyRooms = rooms.filter(r => r.property_id === propertyId && r.room_type === roomType);
  const totalCount = propertyRooms.length;

  const bookings = await getBookingsList();
  const startStr = startDate.split('T')[0];
  const endStr = endDate.split('T')[0];

  const activeBookings = bookings.filter(b => {
    if (b.property_id !== propertyId) return false;
    if (b.status === 'cancelled' || b.status === 'no_show' || b.status === 'checked_out') return false;

    let bType = b.room_type;
    if (!bType && b.room_id) {
       bType = rooms.find(r => r.id === b.room_id)?.room_type;
    }
    
    if (bType !== roomType) return false;
    const bStartStr = b.check_in_date.split('T')[0];
    const bEndStr = b.check_out_date.split('T')[0];
    return (startStr < bEndStr && endStr > bStartStr);
  });

  return totalCount - activeBookings.length;
};
