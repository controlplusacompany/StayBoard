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

export const sendPushNotification = async (title: string, body: string, url?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const response = await fetch('/api/notify/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, url, userId: user.id }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
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

  // Send to Telegram
  sendTelegramNotification(telegramMessage, 'bookings');

  // Send Native Push
  sendPushNotification(
    "New Booking Received! 🛎️",
    `${booking.guest_name} at ${propertyName}`,
    `/dashboard`
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

  // Send to Telegram
  sendTelegramNotification(telegramMessage, 'frontdesk');

  // Send Native Push
  sendPushNotification(
    "Check-In Confirmed! ✅",
    `${booking.guest_name} (Room ${booking.room_number || 'N/A'})`,
    `/dashboard`
  );

  return true;
};

export const notifyCheckoutPayment = async (details: {
  guestName: string;
  roomNumber: string;
  amount: number;
  mode: string;
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

  // Send to Telegram
  sendTelegramNotification(telegramMessage, 'frontdesk');

  // Send Native Push
  sendPushNotification(
    "Payment Received! 💰",
    `${details.guestName} (₹${details.amount}) - Checked Out`,
    `/dashboard`
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

  // Send to Telegram
  sendTelegramNotification(telegramMessage, 'frontdesk');

  // Send Native Push
  sendPushNotification(
    "Payment Received! 💸",
    `${details.guestName} (₹${details.amount} via ${details.method})`,
    `/dashboard`
  );

  return true;
};
