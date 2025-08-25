import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET - Fetch messages between two users (bidirectional)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const senderId = searchParams.get('senderId');
    const receiverId = searchParams.get('receiverId');
    const after = searchParams.get('after');

    if (!senderId || !receiverId) {
      return NextResponse.json({ error: 'Sender ID and Receiver ID are required' }, { status: 400 });
    }

    // Build the query - get messages in both directions between the two users
    let query = supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        read_at,
        sender:profiles!messages_sender_id_fkey (
          id,
          first_name,
          middle_initial,
          last_name,
          email,
          pfp_id
        ),
        receiver:profiles!messages_receiver_id_fkey (
          id,
          first_name,
          middle_initial,
          last_name,
          email,
          pfp_id
        )
      `)
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`);

    // Add after filter if provided (for incremental fetching)
    if (after) {
      query = query.gte('created_at', after);
    }

    // Order by creation time (oldest first, so latest messages appear at bottom)
    query = query.order('created_at', { ascending: true });

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send a new message
export async function POST(request) {
  try {
    const { senderId, receiverId, content } = await request.json();

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ 
        error: 'Sender ID, Receiver ID, and content are required' 
      }, { status: 400 });
    }

    // Insert the message into the database
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        read_at: null
      })
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        read_at,
        sender:profiles!messages_sender_id_fkey (
          id,
          first_name,
          middle_initial,
          last_name,
          email
        ),
        receiver:profiles!messages_receiver_id_fkey (
          id,
          first_name,
          middle_initial,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Error inserting message:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in POST /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Mark messages as read
export async function PUT(request) {
  try {
    const { receiverId, senderId } = await request.json();

    if (!receiverId || !senderId) {
      return NextResponse.json({ 
        error: 'Receiver ID and Sender ID are required' 
      }, { status: 400 });
    }

    // Mark all unread messages from sender to receiver as read
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .is('read_at', null);

    if (error) {
      console.error('Error updating messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
