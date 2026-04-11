export type RoomStatus =
  | 'vacant'
  | 'arriving_today'
  | 'occupied'
  | 'checkout_today'
  | 'cleaning'
  | 'maintenance'

export type PropertyType =
  | 'hotel' | 'guesthouse' | 'bnb' | 'hostel' | 'airbnb' | 'dormitory' | 'cafe' | 'other'

export type PaymentMethod = 'upi' | 'cash' | 'card' | 'online' | 'mixed'

export type BookingStatus =
  | 'unassigned' | 'assigned' | 'checked_in' | 'checked_out' | 'cancelled'

export interface Owner {
  id: string
  name: string
  email: string
  phone?: string
  business_name?: string
  plan: 'free' | 'pro'
  avatar_url?: string
  created_at: string
}

export interface Property {
  id: string
  owner_id: string
  name: string
  type: PropertyType
  address?: string
  city: string
  state: string
  total_rooms: number
  is_active: boolean
  created_at: string
}

export interface Room {
  id: string
  property_id: string
  room_number: string
  floor: number
  max_occupancy: number
  base_price: number
  status: RoomStatus
  staff_notes?: string
  last_status_change: string
  updated_at: string
  is_overdue?: boolean
}

export interface Booking {
  id: string
  room_id?: string 
  property_id: string
  owner_id: string
  guest_name: string
  guest_phone: string
  guest_id_type?: 'aadhaar' | 'passport' | 'driving_license' | 'voter_id' | 'other'
  guest_id_number?: string
  check_in_date: string
  check_out_date: string
  num_guests: number
  price_per_night: number
  total_amount: number
  amount_paid: number
  payment_method?: PaymentMethod
  upi_ref?: string
  booking_source?: 'walk_in' | 'booking_com' | 'makemytrip' | 'cleartrip' | 'airbnb' | 'phone_call' | 'other'
  status: BookingStatus;
  special_requests?: string;
  created_at: string;
}

export type TaskType = 'checkout_clean' | 'daily_clean' | 'deep_clean' | 'inspection' | 'turndown';
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'skipped';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface HousekeepingTask {
  id: string;
  room_id: string;
  property_id: string;
  owner_id: string;
  assigned_to?: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  notes?: string;
  due_by: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partially_paid' | 'void';

export interface PaymentEntry {
  id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference_id?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  booking_id: string;
  property_id: string;
  owner_id: string;
  invoice_number: string;
  amount_total: number;
  amount_paid: number;
  status: InvoiceStatus;
  due_date: string;
  payments: PaymentEntry[];
  created_at: string;
}
export interface Guest {
  id: string;
  owner_id: string;
  name: string;
  phone: string;
  email?: string;
  id_type?: 'aadhaar' | 'passport' | 'driving_license' | 'voter_id' | 'other';
  id_number?: string;
  total_stays?: number;
  total_spent?: number;
  last_stay_date?: string;
  notes?: string;
  is_vip?: boolean;
  check_in_date?: string;
  check_out_date?: string;
  stay_duration?: number;
  created_at?: string;
}

export interface RateRule {
  id: string;
  property_id: string;
  name: string;
  plan: 'room_only' | 'breakfast' | 'meals' | 'all_inclusive';
  include_tax: boolean;
  start_date: string;
  end_date: string;
  adjustment_type: 'percentage' | 'fixed';
  adjustment_value: number; // e.g. +20% for weekend, -10% for off-season
  days_of_week: number[]; // 0 = Sunday, 1 = Monday, etc. [] means all.
  is_active: boolean;
  created_at: string;
}

export interface ChannelConnection {
  id: string;
  property_id: string;
  channel_name: 'booking_com' | 'agoda' | 'airbnb' | 'makemytrip' | 'expedia' | 'goibibo' | 'other';
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  last_sync_time?: string;
  markup_percentage: number; 
  is_active: boolean;
  created_at: string;
}


