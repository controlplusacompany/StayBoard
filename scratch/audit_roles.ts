import { supabaseService } from './src/lib/supabase';

async function auditRoles() {
    console.log('--- Account Role Audit ---');
    const { data: profiles, error } = await supabaseService
        .from('profiles')
        .select('email, role');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    profiles?.forEach(p => {
        console.log(`Email: ${p.email} -> Role: ${p.role}`);
    });
}

auditRoles();
