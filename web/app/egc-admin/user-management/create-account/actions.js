'use server';

import { createClient } from '@supabase/supabase-js';

export async function createUser(formData) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // Create the user with Supabase admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true // Auto-confirm the email
        });

        if (authError) throw authError;

        // Create a profile record in the profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    email: formData.email,
                    role_id: formData.role_id
                }
            ]);

        if (profileError) throw profileError;

        return { success: true, user: authData.user };
    } catch (error) {
        console.error('Error creating user:', error);
        throw new Error(error.message);
    }
} 