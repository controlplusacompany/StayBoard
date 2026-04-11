
import { supabase } from '../src/lib/supabase';

async function checkGuests() {
  const { data: guests, error: gError } = await supabase.from('guests').select('*');
  const { data: bookings, error: bError } = await supabase.from('bookings').select('*');
  
  console.log('--- DB CHECK ---');
  console.log('Total Bookings:', bookings?.length);
  console.log('Total Guests:', guests?.length);
  
  if (gError) console.error('Guest Error:', gError);
  if (bError) console.error('Booking Error:', bError);
  
  if (guests?.length === 0 && bookings?.length > 0) {
    console.log('Detected mismatch. Guests table is empty but bookings exist.');
  }
}

checkGuests();
