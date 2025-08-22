import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

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
      if (!contractId) {
        return NextResponse.json(
          { error: 'Contract ID is required' },
          { status: 400 }
        );
      }

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

      // Combine contract data (no luggage table)
      const contractWithLuggage = {
        ...contract,
        contract_status: statusObj,
        luggage: []
      };

      return NextResponse.json({ data: contractWithLuggage });
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

      // Combine contract data (no luggage table)
      const contractWithLuggage = {
        ...contract,
        contract_status: statusObj,
        luggage: []
      };

      return NextResponse.json({ data: contractWithLuggage });
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
        flight_number, case_number, luggage_description, luggage_weight, luggage_quantity,
        summary_id,
        airline:airline_id (*),
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

    // Build final contracts (no luggage table)
    const contractsWithLuggage = contracts.map(c => ({
      ...c,
      contract_status: statusById.get(c.contract_status_id) || null,
      luggage: []
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
      const { userId, statusName } = params;
      const { data: statusData, error: statusError } = await supabase
        .from('profiles_status')
        .select('id')
        .eq('status_name', statusName)
        .single();

      if (statusError || !statusData) {
        return NextResponse.json({ error: 'Invalid status name' }, { status: 400 });
      }

      const { error, data } = await supabase
        .from('profiles')
        .update({ user_status_id: statusData.id })
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

    // Handle fetching summaries
    if (action === 'getSummaries') {
      const { data, error } = await supabase
        .from('summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ summaries: data || [] });
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

    // Handle proof of delivery fetch
    if (action === 'getProofOfDelivery') {
      const { contract_id } = params;
      if (!contract_id) {
        return NextResponse.json({ error: 'Missing contract_id' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('contracts')
        .select('proof_of_delivery')
        .eq('id', contract_id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data || !data.proof_of_delivery) {
        return NextResponse.json({ error: 'No proof of delivery found' }, { status: 404 });
      }

      return NextResponse.json({ proof_of_delivery: data.proof_of_delivery });
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
            model: "gemini-2.0-flash",
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