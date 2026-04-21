const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function auditRoles() {
    console.log('--- Account Role Audit ---');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email, role');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    profiles.forEach(p => {
        console.log(`Email: ${p.email} -> Role: ${p.role}`);
    });
}

auditRoles();
