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

async function fullSchemaDrill() {
    console.log('--- Full Schema Drill ---');

    const tables = ['users', 'profiles', 'staff', 'receptionists', 'admins', 'owners'];
    
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`[${table}] Error:`, error.message);
        } else {
            console.log(`[${table}] Columns:`, Object.keys(data[0] || {}));
            if (data.length > 0) console.log(`[${table}] Sample:`, data[0]);
        }
    }

    console.log('--- End Drill ---');
}

fullSchemaDrill();
