import { createClient } from '@supabase/supabase-js';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function createUser(formData) {
    try {
        const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true
        });

        if (userError) throw userError;

        const userScoped = createServerActionClient({ cookies });
        const { error: profileError } = await userScoped.from('profiles').insert([{
            id: userData.user.id,
            email: formData.email,
            role_id: formData.role_id
        }]);

        if (profileError) throw profileError;
        return { success: true, data: userData };
    } catch (error) {
        throw new Error(error.message || 'Failed to create user');
    }
}

export async function updateUser(userId, formData) {
    try {
        const updateData = {};
        if (formData.role_id) updateData.role_id = formData.role_id;
        if (formData.user_status_id) updateData.user_status_id = formData.user_status_id;

        const userScoped = createServerActionClient({ cookies });
        const { error } = await userScoped.from('profiles').update(updateData).eq('id', userId);
        if (error) throw error;
        return { success: true };
    } catch (error) {
        throw new Error(error.message || 'Failed to update user');
    }
}

export async function deleteUser(userId) {
    try {
        const userScoped = createServerActionClient({ cookies });
        const { error } = await userScoped.from('profiles').delete().eq('id', userId);
        if (error) throw error;
        return { success: true };
    } catch (error) {
        throw new Error(error.message || 'Failed to delete user');
    }
} 