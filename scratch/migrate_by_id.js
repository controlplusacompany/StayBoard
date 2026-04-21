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

async function migrateByIDs() {
    console.log('--- Phase 2: Role Assignment by UUID ---');

    // 1. controlplusacompany@gmail.com -> Admin
    const adminId = '995297d4-4e24-4e05-b0b6-4c9de421377b';
    console.log(`Setting Admin role for UID ${adminId}...`);
    const { error: err1 } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', adminId);
    if (err1) console.error('Admin update failed:', err1);
    else console.log('Admin role confirmed.');

    // 2. starrynightroomandhostel@gmail.com -> Owner
    const ownerId = '57611f7b-7fd2-45f4-a0aa-ad35b5215715';
    console.log(`Setting Owner role for UID ${ownerId}...`);
    const { error: err2 } = await supabase.from('profiles').update({ role: 'owner' }).eq('id', ownerId);
    if (err2) console.error('Owner update failed:', err2);
    else console.log('Owner role confirmed.');

    console.log('--- Migration Complete ---');
}

migrateByIDs();
