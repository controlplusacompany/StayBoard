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

async function syncProfiles() {
    console.log('--- Syncing Identity Profiles ---');

    const adminId = '995297d4-4e24-4e05-b0b6-4c9de421377b';
    const ownerId = '57611f7b-7fd2-45f4-a0aa-ad35b5215715';

    // 1. Ensure Admin Profile exists
    console.log('Syncing Admin Profile...');
    const { error: err1 } = await supabase.from('profiles').upsert({
        id: adminId,
        role: 'admin',
        full_name: 'StayBoard Admin',
        updated_at: new Date().toISOString()
    });
    if (err1) console.error('Admin sync fail:', err1);

    // 2. Ensure Owner Profile exists
    console.log('Syncing Owner Profile...');
    const { error: err2 } = await supabase.from('profiles').upsert({
        id: ownerId,
        role: 'owner',
        full_name: 'Starry Nights Owner',
        updated_at: new Date().toISOString()
    });
    if (err2) console.error('Owner sync fail:', err2);

    // 3. Update Owners Table Name
    console.log('Updating Owners business name...');
    await supabase.from('owners').update({ name: 'Starry Nights Owner' }).eq('id', ownerId);

    console.log('--- Sync Complete! ---');
    console.log('You can now log in with both accounts.');
}

syncProfiles();
