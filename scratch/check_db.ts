import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cveorgfvnwipedxviwfq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZW9yZ2Z2bndpcGVkeHZpd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDkyMzksImV4cCI6MjA5MTMyNTIzOX0.oGZDTg2ERs_Z0p16P-V85cCRP36OjW_m2UJ-i7IbXDA";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: props } = await supabase.from('properties').select('name');
  const { data: rooms } = await supabase.from('rooms').select('room_number');
  const { data: bookings } = await supabase.from('bookings').select('guest_name');
  
  console.log('Properties in DB:', props?.length || 0);
  console.log('Rooms in DB:', rooms?.length || 0);
  console.log('Bookings in DB:', bookings?.length || 0);
}

check();
