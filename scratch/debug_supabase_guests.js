
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cveorgfvnwipedxviwfq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZW9yZ2Z2bndpcGVkeHZpd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDkyMzksImV4cCI6MjA5MTMyNTIzOX0.oGZDTg2ERs_Z0p16P-V85cCRP36OjW_m2UJ-i7IbXDA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log('Testing connection to guests table...');
  const testGuest = {
    id: 'test-' + Date.now(),
    owner_id: '001',
    name: 'Sync Test User',
    phone: '1234567890',
    id_type: 'other',
    id_number: 'TEST',
    total_stays: 1,
    total_spent: 0,
    is_vip: false,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('guests').insert([testGuest]).select();
  
  if (error) {
    console.error('INSERT ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('INSERT SUCCESS:', data);
    // Cleanup
    await supabase.from('guests').delete().eq('id', testGuest.id);
  }
}

testInsert();
