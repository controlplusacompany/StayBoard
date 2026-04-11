
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cveorgfvnwipedxviwfq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZW9yZ2Z2bndpcGVkeHZpd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDkyMzksImV4cCI6MjA5MTMyNTIzOX0.oGZDTg2ERs_Z0p16P-V85cCRP36OjW_m2UJ-i7IbXDA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testNakedInsert() {
  console.log('Testing naked insert...');
  const testGuest = {
    owner_id: '00000000-0000-0000-0000-000000000000',
    name: 'Naked Test User',
    phone: '1234567892'
  };

  const { data, error } = await supabase.from('guests').insert([testGuest]).select();
  
  if (error) {
    console.error('INSERT ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('INSERT SUCCESS! Record:', data);
    await supabase.from('guests').delete().eq('id', data[0].id);
  }
}

testNakedInsert();
