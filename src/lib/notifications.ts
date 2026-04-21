/**
 * Notification Service for StayBoard
 * Handles Telegram alerts for the owner
 */

import { supabase } from './supabase';

export const sendTelegramNotification = async (message: string, topic?: 'summaries' | 'bookings' | 'frontdesk') => {
  try {
    const response = await fetch('/api/notify/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, topic }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error triggering telegram notification:', error);
    return false;
  }
};

export const sendPushNotification = async (title: string, body: string, url?: string, options: { broadcast?: boolean } = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const response = await fetch('/api/notify/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        body, 
        url, 
        userId: user.id, 
        broadcast: options.broadcast || false 
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

/**
 * Utility to check if a specific notification channel is enabled
 */
const isChannelEnabled = (channel: 'bookings' | 'checkins' | 'checkouts' | 'payments'): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const config = JSON.parse(localStorage.getItem('stayboard_notif_config') || '{}');
    // Global enable must be true AND specific channel must be true
    return config.enabled !== false && config[channel] !== false;
  } catch {
    return true; // Default to true if config missing
  }
};

/**
 * Internal helper to log history to the database
 * Ensures the activity is tagged to the correct owner for cross-user visibility
 */
const logActivity = async (action: string, details: any, bookingId?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let targetOwnerId = user.id;

    // CROSS-USER LOGIC: If a staff member is logged in, find their property owner
    const { data: profile } = await supabase.from('profiles').select('role, property_id').eq('id', user.id).single();
    
    if (profile && (profile.role === 'staff' || profile.role === 'reception') && profile.property_id) {
      const { data: property } = await supabase.from('properties').select('owner_id').eq('id', profile.property_id).single();
      if (property?.owner_id) {
        targetOwnerId = property.owner_id;
      }
    }

    await supabase.from('booking_activities').insert([{
      action,
      details,
      booking_id: bookingId,
      owner_id: targetOwnerId
    }]);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

/**
 * Pre-formatted alert triggers
 */
export const notifyNewBooking = async (booking: any, propertyName: string) => {
  const telegramMessage = `
🛎️ <b>New Booking Received!</b>
---------------------------
🏢 <b>Property:</b> ${propertyName}
👤 <b>Guest:</b> ${booking.guest_name}
📞 <b>Number:</b> ${booking.guest_phone || 'N/A'}
👥 <b>Guests:</b> ${booking.num_guests || 1}
📅 <b>Arrival:</b> ${booking.check_in_date}
💰 <b>Total Amount:</b> ₹${booking.total_amount}
💳 <b>Paid:</b> ₹${booking.amount_paid || 0}
🚪 <b>Room:</b> ${booking.room_number || 'Unassigned'}
📍 <b>Source:</b> ${booking.booking_source || 'Direct'}
  `.trim();

  // 1. Log to DB for Activity Feed (Bell icon)
  logActivity('NEW_BOOKING', { guest: booking.guest_name, property: propertyName }, booking.id);

  // 2. Send to Telegram (Always for owner)
  sendTelegramNotification(telegramMessage, 'bookings');

  // 3. Broadcast Alert to all stakeholders (Owners/Admins)
  sendPushNotification(
    "New Booking Received! 🛎️",
    `${booking.guest_name} at ${propertyName}`,
    `/dashboard`,
    { broadcast: true }
  );

  return true;
};

export const notifyCheckIn = async (booking: any, propertyName: string) => {
  const telegramMessage = `
✅ <b>Check-In Confirmed!</b>
---------------------------
🏢 <b>Property:</b> ${propertyName}
👤 <b>Guest:</b> ${booking.guest_name}
📞 <b>Number:</b> ${booking.guest_phone || 'N/A'}
👥 <b>Guests:</b> ${booking.num_guests || 1}
🚪 <b>Room:</b> ${booking.room_number || 'N/A'}
💰 <b>Total:</b> ₹${booking.total_amount}
💳 <b>Paid:</b> ₹${booking.amount_paid || 0}
  `.trim();

  // 1. Log to DB for Activity Feed
  logActivity('CHECKIN', { guest: booking.guest_name, room: booking.room_number }, booking.id);

  // 2. Send to Telegram
  sendTelegramNotification(telegramMessage, 'frontdesk');

  // 3. Broadcast Alert
  sendPushNotification(
    "Check-In Confirmed! ✅",
    `${booking.guest_name} (Room ${booking.room_number || 'N/A'})`,
    `/dashboard`,
    { broadcast: true }
  );

  return true;
};

export const notifyCheckoutPayment = async (details: {
  guestName: string;
  roomNumber: string;
  amount: number;
  mode: string;
  bookingId?: string;
}) => {
  const telegramMessage = `
💰 <b>Payment Received (Checkout)</b>
---------------------------
<b>Guest:</b> ${details.guestName}
<b>Room:</b> ${details.roomNumber}
<b>Amount:</b> ₹${details.amount}
<b>Mode:</b> ${details.mode}
<b>Status:</b> Paid & Checked Out
  `.trim();

  // 1. Log to DB
  logActivity('CHECKOUT', { guest: details.guestName, amount: details.amount }, details.bookingId);

  // 2. Send to Telegram
  sendTelegramNotification(telegramMessage, 'frontdesk');

  // 3. Broadcast Alert
  sendPushNotification(
    "Payment Received! 💰",
    `${details.guestName} (₹${details.amount}) - Checked Out`,
    `/dashboard`,
    { broadcast: true }
  );

  return true;
};

export const notifyGeneralPayment = async (details: {
    guestName: string;
    amount: number;
    method: string;
}) => {
    const telegramMessage = `
💸 <b>Payment Received</b>
---------------------------
<b>Guest:</b> ${details.guestName}
<b>Amount:</b> ₹${details.amount}
<b>Method:</b> ${details.method}
    `.trim();

  // 1. Log to DB
  logActivity('PAYMENT', { guest: details.guestName, amount: details.amount }, undefined);

  // 2. Send to Telegram
  sendTelegramNotification(telegramMessage, 'frontdesk');

  // 3. Broadcast Alert
  sendPushNotification(
    "Payment Received! 💸",
    `${details.guestName} (₹${details.amount} via ${details.method})`,
    `/dashboard`,
    { broadcast: true }
  );

  return true;
};
