import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { sendTelegramNotification } from '@/lib/notifications';
import { formatInTimeZone } from 'date-fns-tz';
import { z } from 'zod';

const TIMEZONE = 'Asia/Kolkata';

const summarySchema = z.object({
  type: z.enum(['morning', 'night']).default('morning')
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate Input
  const result = summarySchema.safeParse({
    type: searchParams.get('type')
  });

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: result.error.format() }, { status: 400 });
  }

  const { type } = result.data;

  // Use explicit Timezone for India
  const localToday = formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');

  try {
    // 1. Fetch All Properties using Service Role to ensure all data is visible
    const { data: properties, error: pError } = await supabaseService.from('properties').select('*').eq('is_active', true);
    if (pError || !properties) throw new Error('Could not fetch properties');

    if (type === 'morning') {
      for (const property of properties) {
        // A. Fetch Arrivals today
        const { data: arrivals } = await supabaseService
          .from('bookings')
          .select('id')
          .eq('property_id', property.id)
          .eq('check_in_date', localToday)
          .in('status', ['confirmed', 'partial_payment']);

        // B. Fetch Departures today
        const { data: departures } = await supabaseService
          .from('bookings')
          .select('*, invoices(amount_total, amount_paid)')
          .eq('property_id', property.id)
          .eq('check_out_date', localToday)
          .eq('status', 'checked_in');

        // C. Calculate Occupancy
        const { count: occupiedCount } = await supabaseService
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', property.id)
          .eq('status', 'checked_in');

        const occupancyPercent = property.total_rooms > 0 
          ? Math.round(((occupiedCount || 0) / property.total_rooms) * 100) 
          : 0;

        const balanceToCollect = departures?.reduce((sum, d) => {
          const invs = (d as any).invoices;
          const inv = Array.isArray(invs) ? invs[0] : invs;
          if (inv) return sum + (Number(inv.amount_total) - Number(inv.amount_paid));
          return sum;
        }, 0) || 0;

        const message = `
☀️ <b>${property.name} - Morning</b>
---------------------------
📅 <b>Date:</b> ${localToday}
📊 <b>Occupancy:</b> ${occupancyPercent}% (${occupiedCount || 0}/${property.total_rooms} Rooms)

🚶 <b>Expected Arrivals:</b> ${arrivals?.length || 0}
🏃 <b>Expected Departures:</b> ${departures?.length || 0}
💰 <b>Expected Collections:</b> ₹${balanceToCollect.toLocaleString()}
        `.trim();

        await sendTelegramNotification(message, 'summaries');
      }

    } else if (type === 'night') {
      for (const property of properties) {
        // Fetch all financial activity for today
        const fetchDate = `${localToday}T00:00:00Z`;
        const { data: bookingsToday } = await supabaseService
          .from('bookings')
          .select('amount_paid')
          .eq('property_id', property.id)
          .gte('created_at', fetchDate);

        const propertyCollected = bookingsToday?.reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0) || 0;
        const newBookingCount = bookingsToday?.length || 0;

        const { count: occupiedCount } = await supabaseService
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', property.id)
          .eq('status', 'checked_in');

        const message = `
🌙 <b>${property.name} - Night</b>
---------------------------
📅 <b>Date:</b> ${localToday}
💰 <b>Collected Today:</b> ₹${propertyCollected.toLocaleString()}
🆕 <b>New Bookings:</b> ${newBookingCount}
🛏️ <b>Occupied Tonight:</b> ${occupiedCount || 0}/${property.total_rooms}
        `.trim();

        await sendTelegramNotification(message, 'summaries');
      }
    }

    return NextResponse.json({ success: true, date: localToday });
  } catch (error: any) {
    console.error('Summary notification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
