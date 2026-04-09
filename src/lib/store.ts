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

export const getStoredRooms = (defaultRooms: Room[] = []): Room[] => {
  if (typeof window === 'undefined') return defaultRooms;
  const stored = localStorage.getItem(STORAGE_KEYS.ROOMS);
  let parsed: Room[] = stored ? JSON.parse(stored) : [];
  
  if (defaultRooms && defaultRooms.length > 0) {
    const existingPropertyIds = new Set(parsed.map(r => r.property_id));
    const incomingPropertyIds = new Set(defaultRooms.map(r => r.property_id));
    
    let needsUpdate = false;
    incomingPropertyIds.forEach(pid => {
      if (!existingPropertyIds.has(pid)) {
        parsed = [...parsed, ...defaultRooms.filter(r => r.property_id === pid)];
        needsUpdate = true;
      }
    });
    
    if (needsUpdate || !stored) {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(parsed));
    }
  }
  
  return parsed;
};

export const updateRoomStatus = (roomId: string, status: RoomStatus) => {
  const rooms = getStoredRooms([]);
  const updatedRooms = rooms.map(room =>
    room.id === roomId ? { ...room, status, updated_at: new Date().toISOString() } : room
  );
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(updatedRooms));
  window.dispatchEvent(new Event('storage'));
  return updatedRooms;
};

export const getStoredBookings = (defaultBookings: Record<string, Booking> = {}): Record<string, Booking> => {
  if (typeof window === 'undefined') return defaultBookings;
  const stored = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(defaultBookings));
    return defaultBookings;
  }
  return JSON.parse(stored);
};

export const getBookingsList = (): Booking[] => {
  const bookings = getStoredBookings();
  return Object.values(bookings);
};

export const getBookingsForRoom = (roomId: string): Booking[] => {
  return getBookingsList().filter(b => b.room_id === roomId && b.status !== 'cancelled' && b.status !== 'no_show');
};

export const getEnrichedRooms = (defaultRooms: Room[] = []): Room[] => {
  const rooms = getStoredRooms(defaultRooms);
  const bookings = getBookingsList();
  
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localToday = new Date(now.getTime() - offset).toISOString().split('T')[0];

  return rooms.map(room => {
    // Only enrichment logic applies if room is vacant or occupied.
    // We preserve manual statuses like 'cleaning' or 'maintenance' unless 
    // it's actively occupied right now (occupied overrides cleaning).
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
      newStatus = 'arriving_today'; // overriding cleaning if arriving today and it's time? We'll prioritize arriving.
    } else if (checkoutToday) {
      newStatus = 'checkout_today';
    } else if (room.status === 'occupied') {
      // If store says occupied but no active booking, fix it
      newStatus = 'vacant';
    }

    return { ...room, status: newStatus as RoomStatus };
  });
};

export const getStoredTasks = (): HousekeepingTask[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
  return stored ? JSON.parse(stored) : [];
};

export const addTask = (task: Omit<HousekeepingTask, 'id' | 'created_at'>) => {
  const tasks = getStoredTasks();
  const newTask: HousekeepingTask = {
    ...task,
    id: Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString()
  };
  const updatedTasks = [...tasks, newTask];
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
  return updatedTasks;
};

export const updateTaskStatus = (taskId: string, status: TaskStatus, startedAt?: string, completedAt?: string) => {
  const tasks = getStoredTasks();
  const updatedTasks = tasks.map(task =>
    task.id === taskId ? { ...task, status, started_at: startedAt || task.started_at, completed_at: completedAt || task.completed_at } : task
  );
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
  window.dispatchEvent(new Event('storage'));
  return updatedTasks;
};

export const reassignTask = (taskId: string, assignedTo: string) => {
  const tasks = getStoredTasks();
  const updatedTasks = tasks.map(task =>
    task.id === taskId ? { ...task, assigned_to: assignedTo } : task
  );
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
  return updatedTasks;
};

export const getStoredInvoices = (): Record<string, Invoice> => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
  return stored ? JSON.parse(stored) : {};
};

export const addInvoice = (invoiceBase: Omit<Invoice, 'id' | 'created_at' | 'payments' | 'status' | 'amount_paid' | 'invoice_number'>) => {
  const invoices = getStoredInvoices();
  const id = Math.random().toString(36).substr(2, 9);
  
  const newInvoice: Invoice = {
    ...invoiceBase,
    id,
    invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    amount_paid: 0,
    status: 'issued',
    payments: [],
    created_at: new Date().toISOString()
  };
  
  const updatedInvoices = { ...invoices, [id]: newInvoice };
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updatedInvoices));
  return updatedInvoices;
};

export const processPayment = (invoiceId: string, amount: number, method: PaymentMethod) => {
  const invoices = getStoredInvoices();
  const invoice = invoices[invoiceId];
  if (!invoice) return invoices;

  const newPayment: PaymentEntry = {
    id: Math.random().toString(36).substr(2, 9),
    invoice_id: invoiceId,
    amount,
    method,
    created_at: new Date().toISOString()
  };

  const newAmountPaid = invoice.amount_paid + amount;
  
  let newStatus: InvoiceStatus = invoice.status;
  if (newAmountPaid > 0 && newAmountPaid < invoice.amount_total) {
    newStatus = 'partially_paid';
  } else if (newAmountPaid >= invoice.amount_total) {
    newStatus = 'paid';
  }

  const updatedInvoice = {
    ...invoice,
    amount_paid: newAmountPaid,
    status: newStatus,
    payments: [...invoice.payments, newPayment]
  };

  const updatedInvoices = { ...invoices, [invoiceId]: updatedInvoice };
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updatedInvoices));
  return updatedInvoices;
};

export const getStoredGuests = (): Record<string, Guest> => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEYS.GUESTS);
  return stored ? JSON.parse(stored) : {};
};

export const getStoredRateRules = (): Record<string, RateRule> => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEYS.RATES);
  return stored ? JSON.parse(stored) : {};
};

export const addRateRule = (rule: Omit<RateRule, 'id' | 'created_at'>) => {
  const rules = getStoredRateRules();
  const id = Math.random().toString(36).substr(2, 9);
  
  const newRule: RateRule = {
    ...rule,
    id,
    created_at: new Date().toISOString()
  };
  
  const updatedRules = { ...rules, [id]: newRule };
  localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(updatedRules));
  return updatedRules;
};

export const deleteRateRule = (id: string) => {
  const rules = getStoredRateRules();
  if (rules[id]) {
    delete rules[id];
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(rules));
  }
  return rules;
}


export const addBooking = (booking: Booking) => {
  const bookings = getStoredBookings({});
  const updatedBookings = { ...bookings, [booking.id]: booking };
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updatedBookings));

  // Update room status only if booking is for TODAY or in progress
  // Using a more robust date comparison that ignores timezones
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localTodayStr = new Date(now.getTime() - offset).toISOString().split('T')[0];
  const bookingStartStr = booking.check_in_date.split('T')[0];
  const bookingEndStr = booking.check_out_date.split('T')[0];
  
  if (bookingStartStr <= localTodayStr && bookingEndStr > localTodayStr && booking.room_id) {
    updateRoomStatus(booking.room_id, 'occupied');
  }

  // FEATURE 1: AUTO-CREATE TASKS
  if (booking.room_id) {
    const checkoutTime = new Date(booking.check_out_date);
    checkoutTime.setHours(11, 0, 0, 0);

    addTask({
      room_id: booking.room_id,
      property_id: booking.property_id,
      owner_id: booking.owner_id,
      task_type: 'checkout_clean',
      status: 'pending',
      priority: 'normal',
      due_by: checkoutTime.toISOString(),
    });
  }

  // FEATURE 2: AUTO-GENERATE INVOICE
  addInvoice({
    booking_id: booking.id,
    owner_id: booking.owner_id,
    amount_total: booking.total_amount,
    due_date: booking.check_out_date
  });

  // FEATURE 3: AUTO-UPSERT GUEST DIR
  const guests = getStoredGuests();
  // Find guest by phone or ID
  const existingGuestId = Object.values(guests).find(g => 
    g.phone === booking.guest_phone || 
    (g.id_type === booking.guest_id_type && g.id_number === booking.guest_id_number)
  )?.id;

  if (existingGuestId && guests[existingGuestId]) {
    const g = guests[existingGuestId];
    guests[existingGuestId] = {
      ...g,
      total_stays: g.total_stays + 1,
      total_spent: g.total_spent + booking.total_amount,
      last_stay_date: booking.check_in_date
    };
  } else {
    // create new guest
    const newGuestId = Math.random().toString(36).substr(2, 9);
    guests[newGuestId] = {
      id: newGuestId,
      owner_id: booking.owner_id,
      name: booking.guest_name,
      phone: booking.guest_phone,
      id_type: booking.guest_id_type,
      id_number: booking.guest_id_number,
      total_stays: 1,
      total_spent: booking.total_amount,
      last_stay_date: booking.check_in_date,
      is_vip: false,
      created_at: new Date().toISOString()
    };
  }
  localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(guests));

  window.dispatchEvent(new Event('storage'));
  return updatedBookings;
};




export const collectPayment = (bookingId: string, amount: number) => {
  const bookings = getStoredBookings({});
  const booking = bookings[bookingId];
  if (booking) {
    const updatedBooking = { ...booking, amount_paid: (booking.amount_paid || 0) + amount };
    const updatedBookings = { ...bookings, [bookingId]: updatedBooking };
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updatedBookings));
    return updatedBookings;
  }
  return bookings;
};

export const checkOutGuest = (bookingId: string) => {
  const bookings = getStoredBookings({});
  const booking = bookings[bookingId];
  if (booking) {
    // 1. Mark booking as checked_out
    const updatedBooking = { ...booking, status: 'checked_out' as any };
    const updatedBookings = { ...bookings, [bookingId]: updatedBooking };
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updatedBookings));

    // 2. Mark room as cleaning
    if (booking.room_id) {
       updateRoomStatus(booking.room_id, 'cleaning');
    }

    return updatedBookings;
  }
  return bookings;
};

export const finalCheckout = (bookingId: string, payAmount: number, discountAmount: number) => {
  const bookings = getStoredBookings({});
  if (bookings[bookingId]) {
    const booking = bookings[bookingId];
    const updatedBooking = { 
      ...booking, 
      amount_paid: (booking.amount_paid || 0) + payAmount,
      total_amount: (booking.total_amount || 0) - discountAmount,
      status: 'checked_out' as any
    };
    const updatedBookings = { ...bookings, [bookingId]: updatedBooking };
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updatedBookings));
    
    // Mark room as cleaning
    if (booking.room_id) {
      updateRoomStatus(booking.room_id, 'cleaning');
    }
    return updatedBookings;
  }
  return bookings;
};

export const updateStaffNotes = (roomId: string, notes: string) => {
  const rooms = getStoredRooms([]);
  const updatedRooms = rooms.map(room =>
    room.id === roomId ? { ...room, staff_notes: notes } : room
  );
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(updatedRooms));
  return updatedRooms;
};

export const shiftRoom = (bookingId: string, oldRoomId: string, newRoomId: string) => {
  const bookings = getStoredBookings();
  const rooms = getStoredRooms([]);
  const booking = bookings[bookingId];
  if (!booking) return;

  const newRoom = rooms.find(r => r.id === newRoomId);

  // 1. Update Booking
  const updatedBooking = { 
    ...booking, 
    room_id: newRoomId,
    room_type: newRoom?.room_type || booking.room_type 
  };
  const updatedBookings = { ...bookings, [bookingId]: updatedBooking };
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updatedBookings));

  // 2. Update Old Room to cleaning
  updateRoomStatus(oldRoomId, 'cleaning');
  
  // 3. Update New Room to occupied
  updateRoomStatus(newRoomId, 'occupied');

  // 4. Update Tasks (move pending tasks to new room)
  const tasks = getStoredTasks();
  const updatedTasks = tasks.map(task => 
    task.room_id === oldRoomId && task.status === 'pending' ? { ...task, room_id: newRoomId } : task
  );
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));

  window.dispatchEvent(new Event('storage'));
  return updatedBookings;
};

export const getVacantRooms = (propertyId?: string): Room[] => {
  const rooms = getStoredRooms([]);
  const bookings = getBookingsList();
  
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

export const getAvailableRoomTypeCount = (propertyId: string, roomType: string, startDate: string, endDate: string) => {
  const rooms = getStoredRooms([]);
  const propertyRooms = rooms.filter(r => r.property_id === propertyId && r.room_type === roomType);
  const totalCount = propertyRooms.length;

  const bookings = getBookingsList();
  const startStr = startDate.split('T')[0];
  const endStr = endDate.split('T')[0];

  const activeBookings = bookings.filter(b => {
    if (b.property_id !== propertyId) return false;
    if (b.status === 'cancelled' || b.status === 'no_show' || b.status === 'checked_out') return false;

    // Check if room type matches
    let bType = b.room_type;
    if (!bType && b.room_id) {
       // if room type not explicitly on booking, get it from the associated room
       bType = rooms.find(r => r.id === b.room_id)?.room_type;
    }
    
    if (bType !== roomType) return false;

    // Date overlap check
    const bStartStr = b.check_in_date.split('T')[0];
    const bEndStr = b.check_out_date.split('T')[0];
    
    // Check if intervals overlap: max(start1, start2) < min(end1, end2)
    return (startStr < bEndStr && endStr > bStartStr);
  });

  return totalCount - activeBookings.length;
};
