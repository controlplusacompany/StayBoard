
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cveorgfvnwipedxviwfq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZW9yZ2Z2bndpcGVkeHZpd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDkyMzksImV4cCI6MjA5MTMyNTIzOX0.oGZDTg2ERs_Z0p16P-V85cCRP36OjW_m2UJ-i7IbXDA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsertMinimal() {
  console.log('Testing minimal insert to guests table...');
  const testGuest = {
    id: 'test-' + Date.now(),
    owner_id: '001',
    name: 'Minimal Test User',
    phone: '0000000000',
    id_type: 'other',
    id_number: 'TEST',
    total_stays: 1,
    total_spent: 0,
    is_vip: false
    // Removed created_at and updated_at
  };

  const { data, error } = await supabase.from('guests').insert([testGuest]).select();
  
  if (error) {
    console.error('INSERT ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('INSERT SUCCESS:', data);
    await supabase.from('guests').delete().eq('id', testGuest.id);
  }
}

testInsertMinimal();
