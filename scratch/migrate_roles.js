const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    // 2. Promote Owner
    console.log('Promoting starrynightroomandhostel@gmail.com to Owner...');
    const { error: ownerErr } = await supabase
        .from('profiles')
        .update({ role: 'owner' })
        .eq('email', 'starrynightroomandhostel@gmail.com');
    if (ownerErr) console.error('Owner promotion failed:', ownerErr);

    // 3. Remove Old Dev Profile
    console.log('Removing dhagamonish00@gmail.com profile...');
    const { error: delErr } = await supabase
        .from('profiles')
        .delete()
        .eq('email', 'dhagamonish00@gmail.com');
    if (delErr) console.error('Profile removal failed:', delErr);

    console.log('--- Migration Complete ---');
}

migrateRoles();
