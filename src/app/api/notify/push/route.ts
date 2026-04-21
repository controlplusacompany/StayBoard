import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabaseService } from '@/lib/supabase';

// Configure Web Push with VAPID keys safely
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@stayboard.io';
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * Handle Push Subscription Registration
 */
export async function POST(request: Request) {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription || !userId) {
      return NextResponse.json({ error: 'Missing subscription or userId' }, { status: 400 });
    }

    // Save the subscription to Supabase using Admin service client
    const { error } = await supabaseService
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription_json: subscription
      }, { onConflict: 'user_id, subscription_json' });

    if (error) {
      console.error('CRITICAL: Supabase error saving subscription:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Push registration error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Utility to Send Push Notification to All Subscriptions of a User
 * This is an internal helper, not exposed as a public endpoint
 */
export async function sendPushToUser(userId: string, payload: { title: string; body: string; icon?: string; url?: string }) {
  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription_json')
      .eq('user_id', userId);

    if (error || !subscriptions) return;

    const pushPromises = subscriptions.map((sub: any) => 
      webpush.sendNotification(
        sub.subscription_json,
        JSON.stringify(payload)
      ).catch(err => {
        // If subscription is expired or revoked, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log('Push subscription expired, deleting...');
          return supabase
            .from('push_subscriptions')
            .delete()
            .eq('subscription_json', sub.subscription_json);
        }
        console.error('Error sending push:', err);
      })
    );

    await Promise.all(pushPromises);
  } catch (err) {
    console.error('In sendPushToUser:', err);
  }
}
