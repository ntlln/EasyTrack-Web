'use server';

import { createClient } from '@supabase/supabase-js';

// Validation functions
function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function sanitizeEmail(email) { return email.trim().toLowerCase(); }
function validateRole(role) { return role && role !== ''; }

// Password generation
function generateSecurePassword(length = 8) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    let password = "";
    for (let i = 0; i < length; i++) { password += charset[randomBytes[i] % charset.length]; }
    return password;
}

export async function createUser(formData) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        if (!validateEmail(formData.email)) throw new Error('Invalid email format');
        if (!validateRole(formData.role_id)) throw new Error('Invalid role selected');

        const sanitizedEmail = sanitizeEmail(formData.email);
        const encryptedValue = generateSecurePassword();

        // Create user account
        const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(sanitizedEmail, {
            email: sanitizedEmail,
            data: { password: encryptedValue, role: formData.role_id },
            options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invitation` },
        });

        if (inviteError) throw new Error(inviteError.message);

        // Update user metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, {
            email: sanitizedEmail,
            password: encryptedValue,
            user_metadata: { password: null, role: null }
        });

        if (updateError) throw new Error(updateError.message);

        // Create user profile
        const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: sanitizedEmail,
            role_id: formData.role_id,
        });

        if (profileError) {
            await supabase.auth.admin.deleteUser(data.user.id);
            throw new Error('Profile creation failed: ' + profileError.message);
        }

        return { success: true, message: 'Account created! Check your email to verify.' };
    } catch (error) {
        console.error('Error creating user:', error);
        throw new Error(error.message);
    }
} 