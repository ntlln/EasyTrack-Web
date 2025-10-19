'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

function validateEmail(email) { 
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); 
}

function sanitizeEmail(email) { 
    return email.trim().toLowerCase(); 
}

function validateRole(role) { 
    return role && role !== ''; 
}

function generateSecurePassword(length = 8) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    let password = "";
    for (let i = 0; i < length; i++) { 
        password += charset[randomBytes[i] % charset.length]; 
    }
    return password;
}

export async function createUser(formData) {
    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        if (!validateEmail(formData.email)) throw new Error('Invalid email format');
        if (!validateRole(formData.role_id)) throw new Error('Invalid role selected');

        const sanitizedEmail = sanitizeEmail(formData.email);
        const encryptedValue = generateSecurePassword();

        const { data, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(sanitizedEmail, {
            email: sanitizedEmail,
            data: { password: encryptedValue, role: formData.role_id },
            options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invitation` },
        });

        if (inviteError) throw new Error(inviteError.message);

        const { error: updateError } = await adminClient.auth.admin.updateUserById(data.user.id, {
            email: sanitizedEmail,
            password: encryptedValue,
            email_confirm: true,
            user_metadata: { password: null, role: null }
        });

        if (updateError) throw new Error(updateError.message);

        const userScoped = createServerActionClient({ cookies });
        const { error: profileError } = await userScoped.from('profiles').insert({
            id: data.user.id,
            email: sanitizedEmail,
            role_id: formData.role_id,
            corporation_id: formData.corporation_id || null,
        });

        if (profileError) {
            await adminClient.auth.admin.deleteUser(data.user.id);
            throw new Error('Profile creation failed: ' + profileError.message);
        }

        return { success: true, message: 'Account created and verified. Invitation email sent.' };
    } catch (error) {
        throw new Error(error.message);
    }
} 