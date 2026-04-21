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

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function migrateRoles() {
    console.log('--- Starting Role Migration ---');

    // 1. Promote Admin
    console.log('Promoting controlplusacompany@gmail.com to Admin...');
    const { error: adminErr } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('email', 'controlplusacompany@gmail.com');
    if (adminErr) console.error('Admin promotion failed:', adminErr);
    else console.log('Successfully promoted Admin.');

    // 2. Promote Owner
    console.log('Promoting starrynightroomandhostel@gmail.com to Owner...');
    const { error: ownerErr } = await supabase
        .from('profiles')
        .update({ role: 'owner' })
        .eq('email', 'starrynightroomandhostel@gmail.com');
    if (ownerErr) console.error('Owner promotion failed:', ownerErr);
    else console.log('Successfully promoted Owner.');

    // 3. Remove Old Dev Profile
    console.log('Removing dhagamonish00@gmail.com profile...');
    const { error: delErr } = await supabase
        .from('profiles')
        .delete()
        .eq('email', 'dhagamonish00@gmail.com');
    if (delErr) console.error('Profile removal failed:', delErr);
    else console.log('Successfully removed Developer profile.');

    console.log('--- Migration Complete ---');
}

migrateRoles();
