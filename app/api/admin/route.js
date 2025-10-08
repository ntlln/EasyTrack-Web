import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export const runtime = 'nodejs';

// Validate API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables');
} else {
  console.log('GEMINI_API_KEY is set:', apiKey.substring(0, 5) + '...');
}

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(apiKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const contractId = searchParams.get('contractId');

    // Use a user-scoped client backed by the anon key and request cookies
    const supabase = createRouteHandlerClient({ cookies });

    // Handle user session fetch for chat support
    if (action === 'userSession') {
      try {
        const authSupabase = createServerComponentClient({ cookies });
        const { data: { session }, error: sessionError } = await authSupabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          return NextResponse.json({ error: 'Session error' }, { status: 401 });
        }

        if (!session) {
          return NextResponse.json({ error: 'No active session' }, { status: 401 });
        }

        const { data: profile, error: profileError } = await authSupabase
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
        console.error('Error in GET /api/admin?action=userSession:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    // Handle messages listing between two users (bidirectional)
    if (action === 'messages') {
      try {
        const senderId = searchParams.get('senderId');
        const receiverId = searchParams.get('receiverId');
        const after = searchParams.get('after');

        if (!senderId || !receiverId) {
          return NextResponse.json({ error: 'Sender ID and Receiver ID are required' }, { status: 400 });
        }

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

        if (after) {
          query = query.gte('created_at', after);
        }

        query = query.order('created_at', { ascending: true });

        const { data: messages, error } = await query;

        if (error) {
          console.error('Error fetching messages:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ messages: messages || [] });
      } catch (error) {
        console.error('Error in GET /api/admin?action=messages:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    // Handle recent conversations for a user
    if (action === 'conversations') {
      try {
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

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
              email,
              pfp_id,
              role_id,
              profiles_roles (role_name)
            ),
            receiver:profiles!messages_receiver_id_fkey (
              id,
              first_name,
              middle_initial,
              last_name,
              email,
              pfp_id,
              role_id,
              profiles_roles (role_name)
            )
          `)
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching conversations:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const conversationMap = new Map();
        conversations.forEach(message => {
          const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
          const otherUser = message.sender_id === userId ? message.receiver : message.sender;

          if (!conversationMap.has(otherUserId)) {
            conversationMap.set(otherUserId, {
              otherUserId,
              otherUser,
              lastMessage: message,
              unreadCount: (!message.read_at && message.receiver_id === userId) ? 1 : 0
            });
          } else {
            const conversation = conversationMap.get(otherUserId);
            if (new Date(message.created_at) > new Date(conversation.lastMessage.created_at)) {
              conversation.lastMessage = message;
            }
            if (!message.read_at && message.receiver_id === userId) {
              conversation.unreadCount++;
            }
          }
        });

        const formattedConversations = Array.from(conversationMap.values()).map(conv => ({
          id: conv.otherUserId,
          name: `${conv.otherUser.first_name || ''} ${conv.otherUser.middle_initial || ''} ${conv.otherUser.last_name || ''}`.trim() || conv.otherUser.email,
          email: conv.otherUser.email,
          avatarUrl: conv.otherUser.pfp_id || null,
          role: conv.otherUser.profiles_roles?.role_name || 'No Role',
          lastMessage: conv.lastMessage.content,
          lastMessageTime: conv.lastMessage.created_at,
          unreadCount: conv.unreadCount,
          isOwnMessage: conv.lastMessage.sender_id === userId
        }));

        formattedConversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

        return NextResponse.json({ conversations: formattedConversations });
      } catch (error) {
        console.error('Error in GET /api/admin?action=conversations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    // Handle logs request
    if (action === 'logs') {
      try {
        const page = parseInt(searchParams.get('page') || '1');
        const per_page = parseInt(searchParams.get('per_page') || '10');
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || 'all';

        // Get project ref from env or URL
        const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]?.split('.')[0];
        if (!projectRef) throw new Error('Project ref not found in NEXT_PUBLIC_SUPABASE_URL');

        // Debug logging
        console.log('ProjectRef:', projectRef);
        console.log('ServiceRoleKey:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8) + '...');

        // Build query params for the platform API
        const params = new URLSearchParams({
          source: 'postgres',
          limit: per_page.toString(),
          offset: ((page - 1) * per_page).toString(),
        });
        if (search) params.append('search', search);
        if (type !== 'all') params.append('event_message', type);

        const platformUrl = `https://api.supabase.com/v1/projects/${projectRef}/logs?${params.toString()}`;

        // Debug logging
        console.log('Platform URL:', platformUrl);

        const response = await fetch(platformUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Supabase Platform Logs API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Failed to fetch logs: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // data.result is the array of logs, data.count is the total
        return NextResponse.json({
          logs: data.result || [],
          total: data.count || 0
        });
      } catch (error) {
        console.error('Error in logs handler:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch logs' },
          { status: 500 }
        );
      }
    }

    // Handle getContract action for polling
    if (action === 'getContract') {
      const contractId = searchParams.get('contractId');
      const includeSummarized = searchParams.get('includeSummarized') === '1';
      if (!contractId) {
        return NextResponse.json(
          { error: 'Contract ID is required' },
          { status: 400 }
        );
      }

      let query = supabase
        .from('contracts')
        .select(`
          id, created_at, accepted_at, pickup_at, delivered_at, cancelled_at,
          pickup_location, pickup_location_geo, drop_off_location, drop_off_location_geo,
          current_location_geo, contract_status_id,
          airline_id, delivery_id, delivery_charge,
          delivery_surcharge, delivery_discount,
          summary_id,
          airline:airline_id (*),
          delivery:delivery_id (*)
        `)
        .eq('id', contractId);

      // Only exclude summarized when not explicitly included
      if (!includeSummarized) {
        query = query.is('summary_id', null);
      }

      const { data: contract, error: contractError } = await query.single();

      if (contractError) {
        console.error('Error fetching contract for polling:', contractError);
        
        // Handle the specific "multiple (or no) rows returned" error
        if (contractError.message && contractError.message.includes('multiple (or no) rows returned')) {
          return NextResponse.json(
            { error: 'Contract not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
        );
      }

      if (!contract) {
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
        );
      }

      // Fetch status for this contract and attach
      let statusObj = null;
      if (contract.contract_status_id != null) {
        const { data: statusRow, error: statusError } = await supabase
          .from('contract_status')
          .select('id, status_name')
          .eq('id', contract.contract_status_id)
          .single();
        
        if (statusError) {
          console.error('Error fetching contract status:', statusError);
          statusObj = null;
        } else {
          statusObj = statusRow || null;
        }
      }

      // Combine contract data with luggage from contract fields
      const contractWithLuggage = {
        ...contract,
        contract_status: statusObj,
        luggage: contract.luggage_description ? [{
          luggage_owner: `${contract.owner_first_name || ''} ${contract.owner_middle_initial || ''} ${contract.owner_last_name || ''}`.replace(/  +/g, ' ').trim() || 'N/A',
          flight_number: contract.flight_number || 'N/A',
          item_description: contract.luggage_description || 'N/A',
          contact_number: contract.owner_contact || 'N/A',
          address: `${contract.delivery_address || ''} ${contract.address_line_1 || ''} ${contract.address_line_2 || ''}`.replace(/  +/g, ' ').trim() || 'N/A'
        }] : []
      };

      return NextResponse.json({ data: contractWithLuggage });
    }

    // Handle audit logs fetch from audit_logs table
    if (action === 'audit-logs') {
      try {
        const { data: logs, error } = await supabase
          .from('audit_logs')
          .select('table_name, event_type, row_data, old_data, created_at, action_by')
          .order('created_at', { ascending: false });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const logsArray = logs || [];
        const actorIds = Array.from(new Set(logsArray.map(l => l.action_by).filter(Boolean)));
        let idToName = new Map();
        if (actorIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, middle_initial, last_name, email')
            .in('id', actorIds);
          if (!profilesError && profiles) {
            profiles.forEach(p => {
              const name = `${p.first_name || ''} ${p.middle_initial || ''} ${p.last_name || ''}`.replace(/  +/g, ' ').trim();
              idToName.set(p.id, name || p.email || p.id);
            });
          }
        }

        const enriched = logsArray.map(l => ({
          ...l,
          action_by_name: l.action_by ? (idToName.get(l.action_by) || l.action_by) : 'N/A',
        }));

        return NextResponse.json({ data: enriched });
      } catch (e) {
        return NextResponse.json({ error: e.message || 'Failed to fetch audit logs' }, { status: 500 });
      }
    }

    // Handle contract location request
    if (contractId) {
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select(`
          id, created_at, accepted_at, pickup_at, delivered_at, cancelled_at,
          pickup_location, pickup_location_geo, drop_off_location, drop_off_location_geo,
          current_location_geo, contract_status_id,
          airline_id, delivery_id, delivery_charge,
          delivery_surcharge, delivery_discount,
          summary_id,
          airline:airline_id (*),
          delivery:delivery_id (*)
        `)
        .eq('id', contractId)
        .is('summary_id', null)
        .single();

      if (contractError) {
        console.error('Error fetching contract:', contractError);
        
        // Handle the specific "multiple (or no) rows returned" error
        if (contractError.message && contractError.message.includes('multiple (or no) rows returned')) {
          return NextResponse.json(
            { error: 'Contract not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
        );
      }

      if (!contract) {
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
        );
      }

      // Fetch status for this contract and attach
      let statusObj = null;
      if (contract.contract_status_id != null) {
        const { data: statusRow, error: statusError } = await supabase
          .from('contract_status')
          .select('id, status_name')
          .eq('id', contract.contract_status_id)
          .single();
        
        if (statusError) {
          console.error('Error fetching contract status:', statusError);
          statusObj = null;
        } else {
          statusObj = statusRow || null;
        }
      }

      // Combine contract data with luggage from contract fields
      const contractWithLuggage = {
        ...contract,
        contract_status: statusObj,
        luggage: contract.luggage_description ? [{
          luggage_owner: `${contract.owner_first_name || ''} ${contract.owner_middle_initial || ''} ${contract.owner_last_name || ''}`.replace(/  +/g, ' ').trim() || 'N/A',
          flight_number: contract.flight_number || 'N/A',
          item_description: contract.luggage_description || 'N/A',
          contact_number: contract.owner_contact || 'N/A',
          address: `${contract.delivery_address || ''} ${contract.address_line_1 || ''} ${contract.address_line_2 || ''}`.replace(/  +/g, ' ').trim() || 'N/A'
        }] : []
      };

      return NextResponse.json({ data: contractWithLuggage });
    }

    // Handle proof of pickup fetch
    if (action === 'getProofOfPickup') {
      const contractIdParam = searchParams.get('contractId');
      if (!contractIdParam) {
        return NextResponse.json({ error: 'Missing contractId' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('contracts')
        .select('proof_of_pickup, pickup_at')
        .eq('id', contractIdParam)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data || !data.proof_of_pickup) {
        return NextResponse.json({ error: 'No proof of pickup available' }, { status: 404 });
      }

      return NextResponse.json({ proof_of_pickup: data.proof_of_pickup, pickup_timestamp: data.pickup_at || null });
    }

    // Handle delivery personnel request
    if (action === 'delivery-personnel') {
      const { data: deliveryPersonnel, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          middle_initial,
          last_name,
          suffix,
          email,
          contact_number,
          user_status_id,
          user_status:user_status_id (status_name)
        `)
        .eq('role_id', 2)
        .order('first_name', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: deliveryPersonnel });
    }

    // Handle all contracts for statistics (no summary_id filter)
    if (action === 'allContracts') {
      const { data: contracts, error: contractError } = await supabase
        .from('contracts')
        .select(`
          id, created_at, accepted_at, pickup_at, delivered_at, cancelled_at,
          pickup_location, pickup_location_geo, drop_off_location, drop_off_location_geo,
          current_location_geo, contract_status_id,
          airline_id, delivery_id, delivery_charge,
          delivery_surcharge, delivery_discount,
          owner_first_name, owner_middle_initial, owner_last_name, owner_contact,
          flight_number, luggage_description, luggage_quantity,
          remarks, passenger_form, proof_of_delivery,
          delivery_address, address_line_1, address_line_2,
          summary_id,
          airline:airline_id (*),
          delivery:delivery_id (*)
        `)
        .order('created_at', { ascending: false });

      if (contractError) {
        return NextResponse.json({ error: contractError.message }, { status: 500 });
      }

      if (!contracts || contracts.length === 0) {
        return NextResponse.json({ data: [] });
      }

      const { data: allStatuses } = await supabase
        .from('contract_status')
        .select('id, status_name');
      const statusById = new Map((allStatuses || []).map(s => [s.id, s]));

      const contractsWithLuggage = contracts.map(c => ({
        ...c,
        contract_status: statusById.get(c.contract_status_id) || null,
        luggage: c.luggage_description ? [{
          luggage_owner: `${c.owner_first_name || ''} ${c.owner_middle_initial || ''} ${c.owner_last_name || ''}`.replace(/  +/g, ' ').trim() || 'N/A',
          flight_number: c.flight_number || 'N/A',
          item_description: c.luggage_description || 'N/A',
          contact_number: c.owner_contact || 'N/A',
          address: `${c.delivery_address || ''} ${c.address_line_1 || ''} ${c.address_line_2 || ''}`.replace(/  +/g, ' ').trim() || 'N/A',
          quantity: c.luggage_quantity || 'N/A'
        }] : []
      }));

      return NextResponse.json({ data: contractsWithLuggage });
    }

    // Handle contracts request (default)
    const { data: contracts, error: contractError } = await supabase
      .from('contracts')
      .select(`
        id, created_at, accepted_at, pickup_at, delivered_at, cancelled_at,
        pickup_location, pickup_location_geo, drop_off_location, drop_off_location_geo,
        current_location_geo, contract_status_id,
        airline_id, delivery_id, delivery_charge,
        delivery_surcharge, delivery_discount,
        owner_first_name, owner_middle_initial, owner_last_name, owner_contact,
          flight_number, luggage_description, luggage_quantity,
          remarks, passenger_form, proof_of_delivery,
        delivery_address, address_line_1, address_line_2,
        summary_id,
        airline:airline_id (id, first_name, middle_initial, last_name, email, contact_number, corporation_id),
        delivery:delivery_id (*)
      `)
      .is('summary_id', null)
      .order('created_at', { ascending: false });

    if (contractError) {
      return NextResponse.json({ error: contractError.message }, { status: 500 });
    }

    if (!contracts || contracts.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch all contract status rows once and build a map
    const { data: allStatuses } = await supabase
      .from('contract_status')
      .select('id, status_name');
    const statusById = new Map((allStatuses || []).map(s => [s.id, s]));

    // Build final contracts with luggage data from contract fields
    const contractsWithLuggage = contracts.map(c => ({
      ...c,
      contract_status: statusById.get(c.contract_status_id) || null,
      luggage: c.luggage_description ? [{
        luggage_owner: `${c.owner_first_name || ''} ${c.owner_middle_initial || ''} ${c.owner_last_name || ''}`.replace(/  +/g, ' ').trim() || 'N/A',
        flight_number: c.flight_number || 'N/A',
        item_description: c.luggage_description || 'N/A',
        contact_number: c.owner_contact || 'N/A',
        address: `${c.delivery_address || ''} ${c.address_line_1 || ''} ${c.address_line_2 || ''}`.replace(/  +/g, ' ').trim() || 'N/A',
        quantity: c.luggage_quantity || 'N/A'
      }] : []
    }));

    return NextResponse.json({ data: contractsWithLuggage });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Handle multipart form data (file uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      const bucket = formData.get('bucket');
      const path = formData.get('path');

      if (!file || !bucket || !path) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Use a user-scoped client for storage operations as well
      const supabase = createRouteHandlerClient({ cookies });

      // Upload file to Supabase storage with upsert
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(path, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true // Allow overwriting existing files
        });

      if (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Get signed URL for the uploaded file
      const { data: { signedUrl }, error: signedUrlError } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(path, 31536000); // URL valid for 1 year

      if (signedUrlError) {
        console.error('Error getting signed URL:', signedUrlError);
        return NextResponse.json({ error: signedUrlError.message }, { status: 500 });
      }

      return NextResponse.json({ signedUrl });
    }

    // Handle JSON data (other actions)
    const body = await req.json();
    const { action, params } = body;

    // Use a user-scoped client backed by the anon key and request cookies
    const supabase = createRouteHandlerClient({ cookies });

    // Handle sending a new message
    if (action === 'sendMessage') {
      try {
        const { senderId, receiverId, content } = params || {};

        if (!senderId || !receiverId || !content) {
          return NextResponse.json({ 
            error: 'Sender ID, Receiver ID, and content are required' 
          }, { status: 400 });
        }

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
        console.error('Error in POST /api/admin (sendMessage):', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    // Handle marking messages as read
    if (action === 'markRead') {
      try {
        const { receiverId, senderId } = params || {};

        if (!receiverId || !senderId) {
          return NextResponse.json({ 
            error: 'Receiver ID and Sender ID are required' 
          }, { status: 400 });
        }

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
        console.error('Error in POST /api/admin (markRead):', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    // Handle logs request
    if (action === 'logs') {
      const { page = 1, per_page = 10, search, type } = params;

      // Fetch logs from Supabase Postgres
      const { data: logs, error } = await supabase
        .from('pg_stat_activity')
        .select('*')
        .order('query_start', { ascending: false });

      if (error) {
        console.error('Error fetching Postgres logs:', error);
        throw new Error(`Failed to fetch logs: ${error.message}`);
      }

      console.log('Received logs:', { count: logs?.length || 0 });

      // Filter logs based on search term and type
      let filteredLogs = logs || [];
      if (search) {
        const searchLower = search.toLowerCase();
        filteredLogs = logs.filter(log =>
          JSON.stringify(log).toLowerCase().includes(searchLower)
        );
      }
      if (type !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.type === type);
      }

      // Apply pagination
      const start = (page - 1) * per_page;
      const end = start + per_page;
      const paginatedLogs = filteredLogs.slice(start, end);

      return NextResponse.json({
        logs: paginatedLogs,
        total: filteredLogs.length
      });
    }

    // Handle payment creation
    if (action === 'createPayment') {
      const { invoice_number, summary_stat, created_at, due_date, total_charge, invoice_image, invoice_id } = params;

      console.log('Payment creation params:', {
        invoice_number,
        summary_stat,
        created_at,
        due_date,
        total_charge,
        invoice_image,
        invoice_id
      });

      if (!invoice_number || !summary_stat || !created_at || !due_date || !total_charge || typeof invoice_image === 'undefined') {
        console.log('Missing fields:', {
          invoice_number: !invoice_number,
          summary_stat: !summary_stat,
          created_at: !created_at,
          due_date: !due_date,
          total_charge: !total_charge,
          invoice_image: typeof invoice_image === 'undefined'
        });
        return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 });
      }

      try {
        // Check if payment with this id already exists
        const { data: existingPayment, error: checkError } = await supabase
          .from('payment')
          .select('id')
          .eq('id', invoice_number)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error checking existing payment:', checkError);
          return NextResponse.json({ error: checkError.message }, { status: 500 });
        }

        if (existingPayment) {
          // Update existing payment
          const { data, error } = await supabase
            .from('payment')
            .update({
              summary_stat,
              due_date,
              total_charge,
              invoice_image,
              invoice_id
            })
            .eq('id', invoice_number)
            .select()
            .single();

          if (error) {
            console.error('Error updating payment:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
          }

          return NextResponse.json({ data });
        } else {
          // Create new payment
          const { data, error } = await supabase
            .from('payment')
            .insert({
              id: invoice_number,
              summary_stat,
              created_at,
              due_date,
              total_charge,
              invoice_image,
              invoice_id
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating payment:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
          }

          return NextResponse.json({ data });
        }
      } catch (error) {
        console.error('Error in payment creation/update:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Handle delivery_surcharge update
    if (action === 'updatedelivery_Surcharge') {
      const { contractId, delivery_surcharge } = params;
      if (typeof contractId === 'undefined' || typeof delivery_surcharge === 'undefined') {
        return NextResponse.json({ error: 'Missing contractId or delivery_surcharge' }, { status: 400 });
      }

      const { error } = await supabase
        .from('contracts')
        .update({ delivery_surcharge })
        .eq('id', contractId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle delivery_discount update
    if (action === 'updatedelivery_discount') {
      const { contractId, delivery_discount } = params;
      if (typeof contractId === 'undefined' || typeof delivery_discount === 'undefined') {
        return NextResponse.json({ error: 'Missing contractId or delivery_discount' }, { status: 400 });
      }

      const { error } = await supabase
        .from('contracts')
        .update({ delivery_discount })
        .eq('id', contractId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle user status update
    if (action === 'updateUserStatus') {
      const { userId, statusName, verifyStatusId, corporationId } = params;
      
      // Prepare update data
      const updateData = {};
      
      // Handle user status update
      if (statusName) {
        const { data: statusData, error: statusError } = await supabase
          .from('profiles_status')
          .select('id')
          .eq('status_name', statusName)
          .single();

        if (statusError || !statusData) {
          return NextResponse.json({ error: 'Invalid status name' }, { status: 400 });
        }
        updateData.user_status_id = statusData.id;
      }
      
      // Handle verify status update
      if (verifyStatusId !== undefined && verifyStatusId !== '') {
        updateData.verify_status_id = verifyStatusId;
      } else if (verifyStatusId === '') {
        updateData.verify_status_id = null;
      }

      // Handle corporation update
      if (corporationId !== undefined) {
        if (corporationId === '' || corporationId === null) {
          updateData.corporation_id = null;
        } else {
          updateData.corporation_id = corporationId;
        }
      }

      const { error, data } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle user deletion
    if (action === 'deleteUser') {
      const { userId } = params;
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle contract assignment
    if (action === 'assignContract') {
      const { contractId, deliveryId, accepted_at } = params;

      if (!contractId || !deliveryId) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('contracts')
        .update({
          delivery_id: deliveryId,
          contract_status_id: 3, // 'Accepted - Awaiting Pickup'
          accepted_at: accepted_at || new Date().toISOString()
        })
        .eq('id', contractId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Handle updating summary_id for contracts
    if (action === 'updateContractSummaryId') {
      const { contractIds, summaryId } = params;

      if (!contractIds || !Array.isArray(contractIds) || !summaryId) {
        return NextResponse.json(
          { error: 'Missing required fields: contractIds (array) and summaryId' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('contracts')
        .update({ summary_id: summaryId })
        .in('id', contractIds)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Handle creating summary record and updating contracts
    if (action === 'createSummary') {
      const { summaryId, totalContracts, totalAmount, deliveredContracts, failedContracts, contractIds } = params;

      if (!summaryId || !contractIds || !Array.isArray(contractIds)) {
        return NextResponse.json(
          { error: 'Missing required fields: summaryId and contractIds (array)' },
          { status: 400 }
        );
      }

      try {
        // Create summary record with only existing columns
        const summaryData = {
          id: summaryId,
          created_at: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        };

        const { data: summaryRecord, error: summaryError } = await supabase
          .from('summary')
          .insert(summaryData)
          .select()
          .single();

        if (summaryError) {
          console.error('Error creating summary record:', summaryError);
          return NextResponse.json({ error: summaryError.message }, { status: 500 });
        }

        // Update contracts with summary_id
        const { data: updatedContracts, error: contractError } = await supabase
          .from('contracts')
          .update({ summary_id: summaryId })
          .in('id', contractIds)
          .select();

        if (contractError) {
          console.error('Error updating contracts:', contractError);
          return NextResponse.json({ error: contractError.message }, { status: 500 });
        }

        return NextResponse.json({ 
          summary: summaryRecord, 
          contracts: updatedContracts 
        });
      } catch (error) {
        console.error('Error in createSummary:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Handle fetching pricing regions
    if (action === 'getPricingRegion') {
      const { data, error } = await supabase
        .from('pricing_region')
        .select('id, region')
        .order('region', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ regions: data });
    }

    // Handle fetching cities by region
    if (action === 'getCitiesByRegion') {
      const { region_id } = params || {};
      if (!region_id) {
        return NextResponse.json({ error: 'Missing region_id' }, { status: 400 });
      }

      // Fetch distinct cities for the given region_id from the pricing table
      const { data, error } = await supabase
        .from('pricing')
        .select('id, city')
        .eq('region_id', region_id)
        .order('city', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ cities: data });
    }

    // Handle fetching price by city
    if (action === 'getPriceByCity') {
      const { city_id } = params || {};
      if (!city_id) {
        return NextResponse.json({ error: 'Missing city_id' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('pricing')
        .select('price')
        .eq('id', city_id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ price: data ? data.price : null });
    }

    // Handle fetching all pricing with region name
    if (action === 'getAllPricing') {
      const { data, error } = await supabase
        .from('pricing')
        .select('id, city, price, updated_at, region:region_id (region)')
        .order('region_id', { ascending: true })
        .order('city', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Flatten the region object for easier frontend use
      const pricing = (data || []).map(row => ({
        id: row.id,
        city: row.city,
        price: row.price,
        updated_at: row.updated_at,
        region: row.region?.region || ''
      }));

      return NextResponse.json({ pricing });
    }

    // Handle fetching all corporations (id and name)
    if (action === 'getAllCorporations') {
      const { data, error } = await supabase
        .from('profiles_corporation')
        .select('id, corporation_name')
        .order('corporation_name', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ corporations: data || [] });
    }

    // Handle fetching corporation emails
    if (action === 'getCorporationEmails') {
      const { data, error } = await supabase
        .from('profiles_corporation')
        .select('id, corporation_name, corporation_email')
        .not('corporation_email', 'is', null)
        .order('corporation_name', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ corporationEmails: data || [] });
    }

    // Handle fetching summaries
    if (action === 'getSummaries') {
      try {
        // Fetch summaries with status information
        const { data: summaries, error: summariesError } = await supabase
          .from('summary')
          .select(`
            *,
            summary_status:summary_status_id (id, status_name)
          `)
          .order('created_at', { ascending: false });

        if (summariesError) {
          return NextResponse.json({ error: summariesError.message }, { status: 500 });
        }

        // Transform the data to flatten the status object
        const summariesWithStatus = (summaries || []).map(summary => ({
          ...summary,
          status_name: summary.summary_status?.status_name || 'N/A',
          status_id: summary.summary_status?.id || null
        }));

        return NextResponse.json({ summaries: summariesWithStatus });
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Handle updating summary invoice ID
    if (action === 'updateSummaryInvoiceId') {
      const { summaryId, invoiceId } = params;
      
      if (!summaryId || !invoiceId) {
        return NextResponse.json(
          { error: 'Missing required fields: summaryId and invoiceId' },
          { status: 400 }
        );
      }

      try {
        const { data, error } = await supabase
          .from('summary')
          .update({ invoice_id: invoiceId })
          .eq('id', summaryId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Handle updating summary status
    if (action === 'updateSummaryStatus') {
      const { summaryId, statusId } = params;
      
      if (!summaryId || !statusId) {
        return NextResponse.json(
          { error: 'Missing required fields: summaryId and statusId' },
          { status: 400 }
        );
      }

      try {
        const { data, error } = await supabase
          .from('summary')
          .update({ summary_status_id: statusId })
          .eq('id', summaryId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Handle fetching contracts by summary_id (for multiple summaries)
    if (action === 'getContractsBySummaryId') {
      const { summaryIds } = params;
      if (!summaryIds || !Array.isArray(summaryIds)) {
        return NextResponse.json({ error: 'Missing or invalid summaryIds array' }, { status: 400 });
      }

      try {
        const { data: contracts, error: contractError } = await supabase
          .from('contracts')
          .select(`
            id, created_at, accepted_at, pickup_at, delivered_at, cancelled_at,
            pickup_location, pickup_location_geo, drop_off_location, drop_off_location_geo,
            current_location_geo, contract_status_id,
            airline_id, delivery_id, delivery_charge,
            delivery_surcharge, delivery_discount,
            owner_first_name, owner_middle_initial, owner_last_name, owner_contact,
          flight_number, luggage_description, luggage_quantity,
          remarks, passenger_form, proof_of_delivery,
            delivery_address, address_line_1, address_line_2,
            summary_id,
            airline:airline_id (*),
            delivery:delivery_id (*)
          `)
          .in('summary_id', summaryIds)
          .order('created_at', { ascending: false });

        if (contractError) {
          return NextResponse.json({ error: contractError.message }, { status: 500 });
        }

        if (!contracts || contracts.length === 0) {
          return NextResponse.json({ contracts: [] });
        }

        // Fetch all contract status rows once and build a map
        const { data: allStatuses } = await supabase
          .from('contract_status')
          .select('id, status_name');
        const statusById = new Map((allStatuses || []).map(s => [s.id, s]));

        // Build final contracts with luggage data
        const contractsWithStatus = contracts.map(c => ({
          ...c,
          contract_status: statusById.get(c.contract_status_id) || null,
          luggage: c.luggage_description ? [{
            luggage_owner: `${c.owner_first_name || ''} ${c.owner_middle_initial || ''} ${c.owner_last_name || ''}`.replace(/  +/g, ' ').trim() || 'N/A',
            flight_number: c.flight_number || 'N/A',
            item_description: c.luggage_description || 'N/A',
            contact_number: c.owner_contact || 'N/A',
        address: `${c.delivery_address || ''} ${c.address_line_1 || ''} ${c.address_line_2 || ''}`.replace(/  +/g, ' ').trim() || 'N/A',
        quantity: c.luggage_quantity || 'N/A'
      }] : []
        }));

        return NextResponse.json({ contracts: contractsWithStatus });
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Handle fetching contracts by single summary ID (for PDF generation)
    if (action === 'getContractsBySingleSummaryId') {
      const { summaryId } = params;
      if (!summaryId) {
        return NextResponse.json({ error: 'Missing summaryId' }, { status: 400 });
      }

      try {
        const { data: contracts, error: contractError } = await supabase
          .from('contracts')
          .select(`
            id, created_at, accepted_at, pickup_at, delivered_at, cancelled_at,
            pickup_location, pickup_location_geo, drop_off_location, drop_off_location_geo,
            current_location_geo, contract_status_id,
            airline_id, delivery_id, delivery_charge,
            delivery_surcharge, delivery_discount,
            owner_first_name, owner_middle_initial, owner_last_name, owner_contact,
          flight_number, luggage_description, luggage_quantity,
          remarks, passenger_form, proof_of_delivery,
            delivery_address, address_line_1, address_line_2,
            summary_id,
            airline:airline_id (*),
            delivery:delivery_id (*)
          `)
          .eq('summary_id', summaryId)
          .order('created_at', { ascending: false });

        if (contractError) {
          return NextResponse.json({ error: contractError.message }, { status: 500 });
        }

        if (!contracts || contracts.length === 0) {
          return NextResponse.json({ contracts: [] });
        }

        // Fetch all contract status rows once and build a map
        const { data: allStatuses } = await supabase
          .from('contract_status')
          .select('id, status_name');
        const statusById = new Map((allStatuses || []).map(s => [s.id, s]));

        // Build final contracts with luggage data
        const contractsWithStatus = contracts.map(c => ({
          ...c,
          contract_status: statusById.get(c.contract_status_id) || null,
          luggage: c.luggage_description ? [{
            luggage_owner: `${c.owner_first_name || ''} ${c.owner_middle_initial || ''} ${c.owner_last_name || ''}`.replace(/  +/g, ' ').trim() || 'N/A',
            flight_number: c.flight_number || 'N/A',
            item_description: c.luggage_description || 'N/A',
            contact_number: c.owner_contact || 'N/A',
        address: `${c.delivery_address || ''} ${c.address_line_1 || ''} ${c.address_line_2 || ''}`.replace(/  +/g, ' ').trim() || 'N/A',
        quantity: c.luggage_quantity || 'N/A'
      }] : []
        }));

        return NextResponse.json({ contracts: contractsWithStatus });
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Handle price update
    if (action === 'updatePrice') {
      const { city_id, price } = params;
      if (!city_id || typeof price === 'undefined') {
        return NextResponse.json({ error: 'Missing city_id or price' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('pricing')
        .update({
          price: price,
          updated_at: new Date().toISOString()
        })
        .eq('id', city_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Handle contract cancellation
    if (action === 'cancelContract') {
      const { contractId } = params;
      if (!contractId) {
        return NextResponse.json({ error: 'Missing contractId' }, { status: 400 });
      }
      const { data, error } = await supabase
        .from('contracts')
        .update({ contract_status_id: 2 }) // 2 = Cancelled
        .eq('id', contractId)
        .select()
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ data });
    }

    // Handle updateRouteHistory
    if (action === 'updateRouteHistory') {
      const { contractId, route_history } = params;
      if (!contractId || !route_history) {
        return NextResponse.json({ error: 'Missing contractId or route_history' }, { status: 400 });
      }

      // Validate route_history format
      if (!Array.isArray(route_history)) {
        return NextResponse.json({ error: 'route_history must be an array' }, { status: 400 });
      }

      // Validate each point in route_history
      for (const point of route_history) {
        if (!point || typeof point !== 'object') {
          return NextResponse.json({ error: 'Invalid route point format' }, { status: 400 });
        }
        if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
          return NextResponse.json({ error: 'Route points must have numeric lat and lng values' }, { status: 400 });
        }
      }

      // Update route history in database
      const { error } = await supabase
        .from('contracts')
        .update({
          route_history
        })
        .eq('id', contractId);

      if (error) {
        console.error('Error updating route history:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle payments fetch
    if (action === 'getPayments') {
      const { data, error } = await supabase
        .from('payment')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ data });
    }

    // Handle payment status update
    if (action === 'updatePaymentStatus') {
      const { payment_id, summary_stat } = params;
      if (!payment_id || !summary_stat) {
        return NextResponse.json({ error: 'Missing payment_id or summary_stat' }, { status: 400 });
      }
      const updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('payment')
        .update({ summary_stat, updated_at })
        .eq('id', payment_id)
        .select()
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ data });
    }

    // Handle proof of delivery/passenger form fetch depending on contract status
    if (action === 'getProofOfDelivery') {
      const { contract_id } = params;
      if (!contract_id) {
        return NextResponse.json({ error: 'Missing contract_id' }, { status: 400 });
      }

      // Fetch status and both potential columns so we can decide what to return
      const { data, error } = await supabase
        .from('contracts')
        .select('contract_status_id, passenger_form, proof_of_delivery, delivered_at')
        .eq('id', contract_id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
      }

      // Choose image source based on status:
      // - Delivered (status_id 5): use passenger_form
      // - Delivery Failed (status_id 6): use proof_of_delivery
      // - Otherwise: prefer passenger_form then fallback to proof_of_delivery
      let payloadUrl = null;
      if (Number(data.contract_status_id) === 5) {
        payloadUrl = data.passenger_form || null;
      } else if (Number(data.contract_status_id) === 6) {
        payloadUrl = data.proof_of_delivery || null;
      } else {
        payloadUrl = data.passenger_form || data.proof_of_delivery || null;
      }

      if (!payloadUrl) {
        return NextResponse.json({ error: 'No proof available' }, { status: 404 });
      }

      // Keep response key as proof_of_delivery for backward compatibility
      return NextResponse.json({ 
        proof_of_delivery: payloadUrl,
        delivery_timestamp: data.delivered_at || null
      });
    }

    // If this is a Gemini insight request
    if (action === 'geminiInsight') {
      const { stats } = params;
      if (stats) {
        try {
          if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
          }

          // Configure the model
          const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite",
            safetySettings: [
              {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
              },
            ],
          });

          const prompt = `Analyze the following delivery statistics and provide actionable insights and recommendations in a clear, concise format. Focus on key trends, potential improvements, and specific actions that could be taken to enhance delivery performance.

Statistics:
${JSON.stringify(stats, null, 2)}

Please provide:
1. A brief overview of the current performance
2. Key trends and patterns identified
3. Specific recommendations for improvement
4. Areas of concern that need attention`;

          console.log('Sending request to Gemini API...');
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          });

          const response = await result.response;
          let text = response.text();
          text = text.replace(/\*\*/g, ''); // Remove all **

          return NextResponse.json({ insight: text });
        } catch (error) {
          console.error('Gemini API error:', error);
          // Log more details about the error
          if (error.response) {
            console.error('Error response:', await error.response.text());
          }
          return NextResponse.json({
            error: 'Failed to generate insight. Please check your API key and try again.',
            details: error.message,
            apiKeyPresent: !!apiKey,
            apiKeyPrefix: apiKey ? apiKey.substring(0, 5) + '...' : null
          }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 