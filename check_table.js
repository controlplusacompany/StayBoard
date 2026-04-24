const fs = require('fs');
const path = require('path');

// Basic manual env parser
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const { createClient } = require('@supabase/supabase-js');
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

s.from('night_audits').select('*').limit(1).then(r => {
  if (r.error) {
    console.log('Error Code:', r.error.code);
    console.log('Error Message:', r.error.message);
  } else {
    console.log('Table exists!');
  }
});
