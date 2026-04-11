
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testInsert() {
  console.log('Testing insert...');
  const room = {
    property_id: '010',
    room_number: '101',
    floor: 1,
    room_type: 'deluxe',
    status: 'vacant',
    base_price: 1500,
    max_occupancy: 2
  };
  
  const { data, error } = await supabase.from('rooms').insert([room]).select();
  if (error) {
    console.error('INSERT ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('INSERT SUCCESS:', JSON.stringify(data, null, 2));
  }
}

testInsert();
