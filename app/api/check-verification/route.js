import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { email } = await request.json();
        
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: { users }, error } = await supabase.auth.admin.listUsers({
            filter: { email }
        });

        if (error) {
            return NextResponse.json({ error: 'Error checking user status' }, { status: 500 });
        }

        if (!users?.length) {
            return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
        }

        if (!users[0].email_confirmed_at) {
            return NextResponse.json({ error: 'Please verify your email address before resetting your password' }, { status: 403 });
        }

        return NextResponse.json({ verified: true });
    } catch (error) {
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
} 