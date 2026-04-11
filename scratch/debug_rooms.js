
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

async function check() {
  const { data: properties } = await supabase.from('properties').select('*');
  console.log('Properties:', JSON.stringify(properties, null, 2));
  
  const { data: rooms } = await supabase.from('rooms').select('*');
  console.log('All Rooms (first 5):', JSON.stringify(rooms?.slice(0, 5), null, 2));
}

check();
