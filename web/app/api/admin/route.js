import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

    // Handle contract location request
    if (contractId) {
      const { data, error } = await supabase
        .from('contract')
        .select('current_location_geo')
        .eq('id', contractId)
        .single();

      if (error) {
        console.error('Error fetching contract location:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ 
        data: {
          current_location_geo: data.current_location_geo || null
        }
      });
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
      .from('contract')
      .select(`
        id, created_at, accepted_at, pickup_at, delivered_at, cancelled_at,
        pickup_location, pickup_location_geo, drop_off_location, drop_off_location_geo,
        contract_status_id, contract_status(status_name),
        airline_id, delivery_id, delivery_charge,
        surcharge, discount,
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

    const contractIds = contracts.map(c => c.id);
    const { data: luggage, error: luggageError } = await supabase
      .from('contract_luggage_information')
      .select('*')
      .in('contract_id', contractIds);

    if (luggageError) {
      return NextResponse.json({ error: luggageError.message }, { status: 500 });
    }

    const luggageByContract = {};
    luggage.forEach(l => {
      if (!luggageByContract[l.contract_id]) luggageByContract[l.contract_id] = [];
      luggageByContract[l.contract_id].push(l);
    });

    const contractsWithLuggage = contracts.map(c => ({
      ...c,
      luggage: luggageByContract[c.id] || []
    }));

    return NextResponse.json({ data: contractsWithLuggage });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle multipart form data (file uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
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
    const body = await request.json();
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
      const { invoice_number, payment_status_id, created_at, due_date, total_charge, invoice_image } = params;

      console.log('Payment creation params:', {
        invoice_number,
        payment_status_id,
        created_at,
        due_date,
        total_charge,
        invoice_image
      });

      if (!invoice_number || !payment_status_id || !created_at || !due_date || !total_charge || !invoice_image) {
        console.log('Missing fields:', {
          invoice_number: !invoice_number,
          payment_status_id: !payment_status_id,
          created_at: !created_at,
          due_date: !due_date,
          total_charge: !total_charge,
          invoice_image: !invoice_image
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
              payment_status_id,
              due_date,
              total_charge,
              invoice_image
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
              payment_status_id,
              created_at,
              due_date,
              total_charge,
              invoice_image
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

    // Handle surcharge update
    if (action === 'updateSurcharge') {
      const { contractId, surcharge } = params;
      if (typeof contractId === 'undefined' || typeof surcharge === 'undefined') {
        return NextResponse.json({ error: 'Missing contractId or surcharge' }, { status: 400 });
      }

      const { error } = await supabase
        .from('contract')
        .update({ surcharge })
        .eq('id', contractId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle discount update
    if (action === 'updateDiscount') {
      const { contractId, discount } = params;
      if (typeof contractId === 'undefined' || typeof discount === 'undefined') {
        return NextResponse.json({ error: 'Missing contractId or discount' }, { status: 400 });
      }

      const { error } = await supabase
        .from('contract')
        .update({ discount })
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
      const { contractId, deliveryId } = params;

      if (!contractId || !deliveryId) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('contract')
        .update({ 
          delivery_id: deliveryId,
          contract_status_id: 3 // 'Accepted - Awaiting Pickup'
        })
        .eq('id', contractId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
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
        .from('contract')
        .update({ contract_status_id: 2 }) // 2 = Cancelled
        .eq('id', contractId)
        .select()
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 