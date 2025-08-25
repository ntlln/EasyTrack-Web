import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Session error' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        middle_initial,
        last_name,
        role_id,
        profiles_roles (role_name)
      `)
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const userData = {
      id: profile.id,
      email: profile.email,
      name: `${profile.first_name || ''} ${profile.middle_initial || ''} ${profile.last_name || ''}`.trim() || profile.email,
      role: profile.profiles_roles?.role_name || 'No Role',
      role_id: profile.role_id
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error in GET /api/user-session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
