'use server';

import { createClient } from '@supabase/supabase-js';

// Email validation function
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Email sanitization function
function sanitizeEmail(email) {
    return email.trim().toLowerCase();
}

// Role validation function
function validateRole(role) {
    return role && role !== '';
}

// Function to generate a secure random password using crypto
function generateSecurePassword(length = 8) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    let password = "";
    
    for (let i = 0; i < length; i++) {
        const randomIndex = randomBytes[i] % charset.length;
        password += charset[randomIndex];
    }
    
    return password;
}

export async function createUser(formData) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // Validate email and role
        if (!validateEmail(formData.email)) {
            throw new Error('Invalid email format');
        }

        if (!validateRole(formData.role_id)) {
            throw new Error('Invalid role selected');
        }

        // Sanitize email
        const sanitizedEmail = sanitizeEmail(formData.email);
        const encryptedValue = generateSecurePassword(); // This should be replaced with a secure password generation

        // Send invite email
        const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(sanitizedEmail, {
            email: sanitizedEmail,
            data: {
                password: encryptedValue,
                role: formData.role_id,
            },
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invitation`,
            },
        });

        if (inviteError) {
            throw new Error(inviteError.message);
        }

        // Update user with metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, {
            email: sanitizedEmail,
            password: encryptedValue,
            user_metadata: {
                password: null,
                role: null,
            }
        });

        if (updateError) {
            throw new Error(updateError.message);
        }

        // Create profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: data.user.id,
                email: sanitizedEmail,
                role_id: formData.role_id,
            });

        if (profileError) {
            // Clean up auth user if profile creation fails
            await supabase.auth.admin.deleteUser(data.user.id);
            throw new Error('Profile creation failed: ' + profileError.message);
        }

        return { 
            success: true,
            message: 'Account created! Check your email to verify.'
        };
    } catch (error) {
        console.error('Error creating user:', error);
        throw new Error(error.message);
    }
} 