import { supabaseService } from './supabase';
import { formatInTimeZone } from 'date-fns-tz';

const TIMEZONE = 'Asia/Kolkata';

export interface DashboardStats {
  vacantRooms: number;
  occupiedRooms: number;
  checkinsToday: number;
  checkoutsToday: number;
  revenueToday: number;
}

/**
 * Service to fetch comprehensive Dashboard metrics
 * Using supabaseService for accurate headcounts
 */
export async function getDashboardStats(propertyId?: string): Promise<DashboardStats> {
  const localToday = formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
  
  // Base Query
  let query = supabaseService.from('bookings').select('*');
  if (propertyId) {
    query = query.eq('property_id', propertyId);
  }

  // 1. Fetch All Relevant data in parallel for speed
  let roomQuery = supabaseService.from('rooms').select('id', { count: 'exact', head: true });
  if (propertyId) {
    roomQuery = roomQuery.eq('property_id', propertyId);
  }

  const [
    { data: activeBookings },
    { count: totalRooms }
  ] = await Promise.all([
    query,
    roomQuery
  ]);

  // 2. Compute Metrics
  const occupied = activeBookings?.filter(b => b.status === 'checked_in').length || 0;
  const checkins = activeBookings?.filter(b => b.check_in_date === localToday && ['confirmed', 'partial_payment'].includes(b.status)).length || 0;
  const checkouts = activeBookings?.filter(b => b.check_out_date === localToday && b.status === 'checked_in').length || 0;
  
  // Revenue calculation (simple sum for today)
  const revenue = activeBookings?.reduce((sum, b) => {
    const isToday = b.created_at?.split('T')[0] === localToday;
    return isToday ? sum + (Number(b.amount_paid) || 0) : sum;
  }, 0) || 0;

  return {
    vacantRooms: (totalRooms || 0) - occupied,
    occupiedRooms: occupied,
    checkinsToday: checkins,
    checkoutsToday: checkouts,
    revenueToday: revenue
  };
}

/**
 * Fetch Month-to-Date (MTD) performance across all properties (or one)
 */
export async function getMTDPerformance(propertyId?: string) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  let query = supabaseService.from('bookings').select('total_amount, status, created_at');
  if (propertyId && propertyId !== 'all') {
    query = query.eq('property_id', propertyId);
  }

  const { data: bookings } = await query.gte('created_at', firstDayOfMonth);

  const totalRevenue = bookings?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
  const totalBookings = bookings?.length || 0;

  return {
    totalRevenue,
    totalBookings,
    avgBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0
  };
}

/**
 * Fetch Payment Method distribution for Financials report
 */
export async function getFinancialDistribution(propertyId?: string) {
  let query = supabaseService.from('bookings').select('payment_method, total_amount');
  if (propertyId && propertyId !== 'all') {
    query = query.eq('property_id', propertyId);
  }

  const { data: bookings } = await query;
  
  const distribution: Record<string, number> = {};
  let total = 0;

  bookings?.forEach(b => {
    const method = b.payment_method || 'Other';
    distribution[method] = (distribution[method] || 0) + (Number(b.total_amount) || 0);
    total += (Number(b.total_amount) || 0);
  });

  // Convert to formatted percentages
  return Object.entries(distribution).map(([method, value]) => ({
    med: method.charAt(0).toUpperCase() + method.slice(1),
    val: total > 0 ? `${Math.round((value / total) * 100)}%` : '0%',
    raw: value,
    color: method === 'cash' ? 'bg-orange-400' : method === 'upi' ? 'bg-green-500' : 'bg-blue-500'
  }));
}

/**
 * Fetch Staff list and basic performance metrics
 */
export async function getStaffPerformance(propertyId?: string) {
  // 1. Fetch all profiles
  const { data: profiles } = await supabaseService.from('profiles').select('*');
  
  // 2. Fetch bookings to aggregate performance (if created_by existed)
  // For now, since created_by isn't in schema, we return the list of users
  return (profiles || []).map(p => ({
    name: p.full_name || 'Anonymous',
    role: p.role,
    bookings: 0, // Placeholder until schema update
    checkins: 0  // Placeholder until schema update
  }));
}
