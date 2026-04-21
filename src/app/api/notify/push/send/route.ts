import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase, supabaseService } from '@/lib/supabase';
import { z } from 'zod';

const pushSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  url: z.string().optional().default('/'),
  userId: z.string().uuid().optional(),
  broadcast: z.boolean().optional().default(false)
});

// Configure Web Push with VAPID keys safely
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@stayboard.io';
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * Trigger Push Delivery
 */
export async function POST(request: Request) {
  try {
    // 1. Security Check (remains same)
    const authHeader = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');
    const secret = authHeader?.replace('Bearer ', '') || apiKey;

    let isAuthorized = secret === process.env.CRON_SECRET;

    if (!isAuthorized) {
      const { data: { user } } = await supabase.auth.getUser(secret || undefined);
      if (user) isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate Payload
    const bodyJson = await request.json();
    const result = pushSchema.safeParse(bodyJson);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 });
    }

    const { title, body, url, userId, broadcast } = result.data;

    // 3. Fetch active subscriptions
    let query = supabaseService.from('push_subscriptions').select('subscription_json, user_id');
    
    if (!broadcast && userId) {
      query = query.eq('user_id', userId);
    } else if (!broadcast && !userId) {
      return NextResponse.json({ error: 'Either userId or broadcast must be provided' }, { status: 400 });
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Database error fetching subscriptions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, info: 'No active push subscriptions found for this user.' });
    }

    // 4. Wrap in a payload with high-priority settings
    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png', // For Android status bar
      timestamp: Date.now() // Required for some background wake-ups
    });

    // 5. Send to all devices with High Priority headers
    const pushPromises = subscriptions.map((sub: any) => 
      webpush.sendNotification(
        sub.subscription_json,
        payload,
        {
          headers: {
            'Urgency': 'high', // Wake up sleeping mobile devices
            'Topic': 'administrative'
          },
          TTL: 86400 // Ensure it delivers within 24 hours if device is offline
        }
      ).catch(err => {
        // Handle expired/invalid subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Push failed (410/404), cleaning up subscription for user ${sub.user_id}`);
          return supabaseService
            .from('push_subscriptions')
            .delete()
            .match({ user_id: sub.user_id, subscription_json: sub.subscription_json });
        }
        console.error('Individual push failure:', err);
      })
    );

    const results = await Promise.all(pushPromises);
    const successCount = results.filter(r => r && !(r as any).error).length;

    console.log(`Successfully dispatched ${successCount} notifications to ${subscriptions.length} registered devices.`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Push delivery error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
