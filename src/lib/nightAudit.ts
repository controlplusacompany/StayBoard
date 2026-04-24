import { supabase } from './supabase';
import { Booking, Room, NightAuditEntry } from '@/types';
import { startOfDay, format, subDays } from 'date-fns';
import { getBookingsList, getStoredRooms, getCurrentUserId } from './store';

export const getNightAudits = async (propertyId: string): Promise<NightAuditEntry[]> => {
  const { data } = await supabase
    .from('night_audits')
    .select('*')
    .eq('property_id', propertyId)
    .order('business_date', { ascending: false });
  return (data as NightAuditEntry[]) || [];
};

export const performNightAudit = async (propertyId: string) => {
  const userId = await getCurrentUserId();
  const rooms = await getStoredRooms();
  const bookings = await getBookingsList();
  
  const now = new Date();
  const businessDate = format(subDays(now, 1), 'yyyy-MM-dd'); // Auditing for "Yesterday"
  
  // 1. Find No Shows (Scheduled for yesterday but still assigned/unassigned)
  const noShows = bookings.filter(b => 
    b.property_id === propertyId &&
    ['assigned', 'unassigned'].includes(b.status) &&
    b.check_in_date.split('T')[0] === businessDate
  );

  // 2. Find Delayed Checkouts (Checked in but checkout date was yesterday)
  const delayed = bookings.filter(b => 
    b.property_id === propertyId &&
    b.status === 'checked_in' &&
    b.check_out_date.split('T')[0] === businessDate
  );

  // 3. Calculate Yesterday's Revenue (From bookings active yesterday)
  const activeYesterday = bookings.filter(b => 
    b.property_id === propertyId &&
    b.status === 'checked_in' &&
    b.check_in_date.split('T')[0] <= businessDate &&
    b.check_out_date.split('T')[0] >= businessDate
  );

  const totalRevenue = activeYesterday.reduce((acc, b) => acc + (Number(b.price_per_night) || 0), 0);
  const occupancyPercentage = rooms.length > 0 ? (activeYesterday.length / rooms.length) * 100 : 0;

  const auditEntry: Partial<NightAuditEntry> = {
    property_id: propertyId,
    owner_id: userId,
    business_date: businessDate,
    performed_at: new Date().toISOString(),
    performed_by: 'System Administrator',
    total_revenue: totalRevenue,
    occupancy_percentage: Math.round(occupancyPercentage),
    no_shows_count: noShows.length,
    delayed_checkouts_count: delayed.length,
    status: 'completed',
    summary_json: JSON.stringify({
      noShows: noShows.map(b => b.guest_name),
      delayed: delayed.map(b => b.guest_name),
      activeRooms: activeYesterday.length
    })
  };

  const { data, error } = await supabase.from('night_audits').insert([auditEntry]).select();
  
  if (error) throw error;

  // AUTO-ACTION: Generate Stayover Clean tasks for all checked-in guests
  const stayoverTasks = activeYesterday.map(b => ({
    property_id: propertyId,
    room_id: b.room_id,
    owner_id: userId,
    task_type: 'daily_clean',
    status: 'pending',
    priority: 'normal',
    due_by: new Date().toISOString(), // Due morning of today
    notes: 'Auto-generated during Night Audit'
  }));

  if (stayoverTasks.length > 0) {
    await supabase.from('housekeeping_tasks').insert(stayoverTasks);
  }

  return data?.[0];
};

export const checkAuditStatus = async (propertyId: string, date: string) => {
  const { data } = await supabase
    .from('night_audits')
    .select('status')
    .eq('property_id', propertyId)
    .eq('business_date', date)
    .single();
  return !!data;
};
