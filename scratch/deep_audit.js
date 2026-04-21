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

async function deepAudit() {
    console.log('--- Deep Database Audit ---');

    // Probing for any table named 'users' in any schema
    console.log('Searching for "users" table presence...');
    const { data: usersCount, error: usersErr } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (usersErr) console.log('Public.users check failed:', usersErr.message);
    else console.log('Found public.users table with', usersCount, 'entries.');

    // Checking 'profiles' specifically
    console.log('Auditing "profiles" table metadata...');
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(5);
    if (!pErr) {
        console.log('Current profile data sample:', profiles);
    }

    // Checking for any other common identity tables
    const tablesToProbe = ['staff', 'receptionists', 'admins'];
    for (const t of tablesToProbe) {
        const { data, error } = await supabase.from(t).select('count', { count: 'exact', head: true });
        if (!error) console.log(`Found [${t}] table!`);
    }

    console.log('--- Audit Complete ---');
}

deepAudit();
