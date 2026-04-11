
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cveorgfvnwipedxviwfq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZW9yZ2Z2bndpcGVkeHZpd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDkyMzksImV4cCI6MjA5MTMyNTIzOX0.oGZDTg2ERs_Z0p16P-V85cCRP36OjW_m2UJ-i7IbXDA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findColumns() {
  console.log('Finding guests table columns...');
  // Try to select just one row with all columns
  const { data, error } = await supabase.from('guests').select('*').limit(1);
  
  if (error) {
    console.error('SELECT ALL ERROR:', error);
  } else {
    console.log('COLUMNS DETECTED:', Object.keys(data[0] || { empty: 'no rows' }));
  }
}

findColumns();
