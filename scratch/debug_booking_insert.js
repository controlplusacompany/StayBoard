
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cveorgfvnwipedxviwfq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZW9yZ2Z2bndpcGVkeHZpd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDkyMzksImV4cCI6MjA5MTMyNTIzOX0.oGZDTg2ERs_Z0p16P-V85cCRP36OjW_m2UJ-i7IbXDA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBookingInsert() {
  console.log('Testing booking insert with current settings...');
  const testBooking = {
    id: 'test-b-' + Date.now(),
    property_id: '010', // From screenshot URL
    room_id: '203', // From screenshot URL
    owner_id: '00000000-0000-0000-0000-000000000000',
    guest_name: 'Test Debug',
    guest_phone: '1234567895',
    check_in_date: new Date().toISOString(),
    check_out_date: new Date(Date.now() + 86400000).toISOString(),
    num_guests: 1,
    price_per_night: 1500,
    total_amount: 1500,
    amount_paid: 0,
    status: 'assigned',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('bookings').insert([testBooking]).select();
  
  if (error) {
    console.error('BOOKING INSERT ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('BOOKING INSERT SUCCESS! Record:', data);
    await supabase.from('bookings').delete().eq('id', testBooking.id);
  }
}

testBookingInsert();
