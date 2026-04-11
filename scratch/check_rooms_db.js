
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cveorgfvnwipedxviwfq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZW9yZ2Z2bndpcGVkeHZpd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDkyMzksImV4cCI6MjA5MTMyNTIzOX0.oGZDTg2ERs_Z0p16P-V85cCRP36OjW_m2UJ-i7IbXDA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRooms() {
  console.log('Fetching room information...');
  const { data, error } = await supabase.from('rooms').select('*').limit(5);
  
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('ROOM SAMPLES:', data.map(r => ({ id: r.id, number: r.room_number, pid: r.property_id })));
  }
}

checkRooms();
