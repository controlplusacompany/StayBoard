
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cveorgfvnwipedxviwfq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZW9yZ2Z2bndpcGVkeHZpd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDkyMzksImV4cCI6MjA5MTMyNTIzOX0.oGZDTg2ERs_Z0p16P-V85cCRP36OjW_m2UJ-i7IbXDA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findRoom203() {
  console.log('Searching for room 203 in property 010...');
  const { data, error } = await supabase.from('rooms').select('*').eq('property_id', '010').eq('room_number', '203');
  
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('ROOM 203 DATA:', data);
  }
}

findRoom203();
