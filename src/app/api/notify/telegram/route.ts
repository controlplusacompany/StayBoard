import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, topic } = await request.json();
    
    // Mapping topics to Thread IDs from environment variables
    let threadId: string | undefined = undefined;
    if (topic === 'summaries') threadId = process.env.TELEGRAM_THREAD_SUMMARIES;
    else if (topic === 'bookings') threadId = process.env.TELEGRAM_THREAD_BOOKINGS;
    else if (topic === 'frontdesk') threadId = process.env.TELEGRAM_THREAD_FRONTDESK;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Telegram credentials missing in environment variables');
      return NextResponse.json({ error: 'Telegram configuration missing' }, { status: 500 });
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_thread_id: threadId ? parseInt(threadId) : undefined,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telegram API error:', data);
      return NextResponse.json({ error: data.description || 'Failed to send telegram message' }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
