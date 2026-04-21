import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // I need the service role key for DDL if possible, but I don't have it.
// I'll try with anon key, but usually DDL requires more.

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
    console.log("🛠️ Attempting to create push_subscriptions table...");
    
    const { error } = await supabase.rpc('exec_sql', {
        sql_string: `
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                subscription_json JSONB NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, subscription_json)
            );
            ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own push subscriptions') THEN
                    CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
                END IF;
            END
            $$;
        `
    });

    if (error) {
        console.error("❌ Error creating table:", error.message);
        console.log("⚠️ If 'exec_sql' doesn't exist, this script will fail. You might need to run this in Supabase SQL Editor manually.");
    } else {
        console.log("✅ Table created successfully!");
    }
}

createTable();
