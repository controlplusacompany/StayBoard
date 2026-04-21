import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cveorgfvnwipedxviwfq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZW9yZ2Z2bndpcGVkeHZpd2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc0OTIzOSwiZXhwIjoyMDkxMzI1MjM5fQ.iFAcYCNo-1VToS6TIAN_6U_UWQFxNj0pyGXlYqgKY1o';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function forceResetAdmin() {
  const email = 'controlplusacompany@gmail.com';
  const newPassword = 'Admin@Controlplusa@2026';

  console.log(`Force resetting password for: ${email}...`);

  // 1. Find the user ID
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return console.error('List Error:', listError.message);

  const user = usersData.users.find(u => u.email === email);
  if (!user) return console.error('User not found in system.');

  console.log(`Found User ID: ${user.id}. Resetting password...`);

  // 2. Force Update Password
  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error('Update Error:', updateError.message);
  } else {
    console.log('Password successfully reset in Auth system! ✅');

    // 3. Ensure profile is right
    const { error: pError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        role: 'admin',
        full_name: 'ControlPlusA Admin',
        updated_at: new Date().toISOString()
      });

    if (pError) console.error('Profile Error:', pError.message);
    else console.log('Admin profile verified/updated. 🎉');
  }
}

forceResetAdmin();
