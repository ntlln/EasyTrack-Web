import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    console.log('ADMIN API CALLED');
    const body = await req.json();
    console.log('Request body:', body);
    const { action, params } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Only on the server!
    );

    if (action === 'updateUserStatus') {
      const { userId, statusName } = params;
      console.log('Updating user:', userId, 'to status:', statusName);
      const { data: statusData, error: statusError } = await supabase
        .from('profiles_status')
        .select('id')
        .eq('status_name', statusName)
        .single();
      console.log('Status lookup:', statusData, statusError);
      if (statusError || !statusData) return new Response(JSON.stringify({ error: 'Invalid status name' }), { status: 400 });
      const { error, data } = await supabase
        .from('profiles')
        .update({ user_status_id: statusData.id })
        .eq('id', userId);
      console.log('Update result:', data, error);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === 'deleteUser') {
      const { userId } = params;
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // Add more admin actions here as needed

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (error) {
    console.error('API route error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
} 