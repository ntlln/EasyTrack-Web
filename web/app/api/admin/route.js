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

    // Handle contract location request
    if (contractId) {
      const { data, error } = await supabase
        .from('contract')
        .select('current_location_geo')
        .eq('id', Number(contractId))
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

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 