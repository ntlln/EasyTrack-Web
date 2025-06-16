import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { email } = await request.json();
        
        // Create a Supabase client with admin privileges
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: { users }, error } = await supabase.auth.admin.listUsers({
            filter: {
                email: email
            }
        });

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: 'Error checking user status' }, { status: 500 });
        }

        if (!users || users.length === 0) {
            return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
        }

        const user = users[0];
        if (!user.email_confirmed_at) {
            return NextResponse.json({ error: 'Please verify your email address before resetting your password' }, { status: 403 });
        }

        return NextResponse.json({ verified: true });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
} 