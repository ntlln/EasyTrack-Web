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

// GET - Fetch recent conversations where user is involved (sender or receiver)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get all conversations where the user is involved (sender or receiver)
    const { data: conversations, error } = await supabase
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
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group messages by conversation and get the latest message for each
    const conversationMap = new Map();

    conversations.forEach(message => {
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      const otherUser = message.sender_id === userId ? message.receiver : message.sender;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          otherUserId,
          otherUser,
          lastMessage: message,
          unreadCount: 0
        });
      } else {
        const conversation = conversationMap.get(otherUserId);
        // Update if this message is more recent
        if (new Date(message.created_at) > new Date(conversation.lastMessage.created_at)) {
          conversation.lastMessage = message;
        }
        // Update unread count if message is unread and receiver is current user
        if (!message.read_at && message.receiver_id === userId) {
          conversation.unreadCount++;
        }
      }
    });

    // Convert map to array and format the response
    const formattedConversations = Array.from(conversationMap.values()).map(conv => ({
      id: conv.otherUserId,
      name: `${conv.otherUser.first_name || ''} ${conv.otherUser.middle_initial || ''} ${conv.otherUser.last_name || ''}`.trim() || conv.otherUser.email,
      email: conv.otherUser.email,
      lastMessage: conv.lastMessage.content,
      lastMessageTime: conv.lastMessage.created_at,
      unreadCount: conv.unreadCount,
      isOwnMessage: conv.lastMessage.sender_id === userId
    }));

    // Sort by last message time (most recent first)
    formattedConversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
