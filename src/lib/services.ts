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
  const [
    { data: activeBookings },
    { count: totalRooms }
  ] = await Promise.all([
    query,
    supabaseService.from('rooms').select('id', { count: 'exact', head: true }).eq('property_id', propertyId || '')
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
