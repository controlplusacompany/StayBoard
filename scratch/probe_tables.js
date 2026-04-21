const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function probe() {
    console.log('--- Probing Public Tables ---');

    // 1. Try to fetch from 'users' table
    const { data: users, error: usersErr } = await supabase.from('users').select('*').limit(1);
    if (usersErr) console.log('TABLE [users]: Not found or Error:', usersErr.message);
    else console.log('TABLE [users]: Found! Columns:', Object.keys(users[0] || {}), 'Rows:', users.length);

    // 2. Try to fetch from 'profiles' table
    const { data: profiles, error: profilesErr } = await supabase.from('profiles').select('*').limit(1);
    if (profilesErr) console.log('TABLE [profiles]: Not found or Error:', profilesErr.message);
    else console.log('TABLE [profiles]: Found! Columns:', Object.keys(profiles[0] || {}), 'Rows:', profiles.length);

    // 3. Try to fetch from 'owners' table
    const { data: owners, error: ownersErr } = await supabase.from('owners').select('*').limit(1);
    if (ownersErr) console.log('TABLE [owners]: Not found or Error:', ownersErr.message);
    else console.log('TABLE [owners]: Found! Columns:', Object.keys(owners[0] || {}), 'Rows:', owners.length);

    console.log('--- Probe Complete ---');
}

probe();
