import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendTelegramNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'morning';
  const authHeader = request.headers.get('authorization');
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localToday = new Date(now.getTime() - offset).toISOString().split('T')[0];

  try {
    // 1. Fetch All Properties
    const { data: properties, error: pError } = await supabase.from('properties').select('*').eq('is_active', true);
    if (pError || !properties) throw new Error('Could not fetch properties');

    if (type === 'morning') {
      for (const property of properties) {
        // A. Fetch Arrivals today
        const { data: arrivals } = await supabase
          .from('bookings')
          .select('id')
          .eq('property_id', property.id)
          .eq('check_in_date', localToday)
          .in('status', ['unassigned', 'assigned']);

        // B. Fetch Departures today with Invoice/Balance info
        const { data: departures } = await supabase
          .from('bookings')
          .select('*, invoices(amount_total, amount_paid)')
          .eq('property_id', property.id)
          .eq('check_out_date', localToday)
          .eq('status', 'checked_in');

        // C. Calculate Occupancy
        const { count: occupiedCount } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', property.id)
          .eq('status', 'checked_in');

        const occupancyPercent = property.total_rooms > 0 
          ? Math.round(((occupiedCount || 0) / property.total_rooms) * 100) 
          : 0;

        // D. Calculate Financials (Balance to collect from departures)
        const balanceToCollect = departures?.reduce((sum, d) => {
          const inv = Array.isArray((d as any).invoices) ? (d as any).invoices[0] : (d as any).invoices;
          if (inv) return sum + (Number(inv.amount_total) - Number(inv.amount_paid));
          return sum;
        }, 0) || 0;

        // E. Format Simple Message
        const message = `
☀️ <b>${property.name} - Morning</b>
---------------------------
📊 <b>Occupancy:</b> ${occupancyPercent}% (${occupiedCount || 0}/${property.total_rooms} Rooms)

🚶 <b>Expected Arrivals:</b> ${arrivals?.length || 0}
🏃 <b>Expected Departures:</b> ${departures?.length || 0}
💰 <b>Balance to Collect:</b> ₹${balanceToCollect.toLocaleString()}
        `.trim();

        await sendTelegramNotification(message, 'summaries');
      }
      return NextResponse.json({ success: true });

    } else if (type === 'night') {
      for (const property of properties) {
        // A. Today's Collections
        const { data: bookingsToday } = await supabase
          .from('bookings')
          .select('amount_paid')
          .eq('property_id', property.id)
          .filter('created_at', 'gte', `${localToday}T00:00:00Z`);

        const propertyCollected = bookingsToday?.reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0) || 0;

        // B. New Bookings Today
        const newBookingCount = bookingsToday?.length || 0;

        // C. Current Occupancy
        const { count: occupiedCount } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', property.id)
          .eq('status', 'checked_in');

        const message = `
🌙 <b>${property.name} - Night</b>
---------------------------
💰 <b>Total Collected Today:</b> ₹${propertyCollected.toLocaleString()}
🆕 <b>New Bookings Made:</b> ${newBookingCount}
🛏️ <b>Occupancy for Tonight:</b> ${occupiedCount || 0}/${property.total_rooms}
        `.trim();

        await sendTelegramNotification(message, 'summaries');
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid summary type' }, { status: 400 });
  } catch (error) {
    console.error('Summary notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
