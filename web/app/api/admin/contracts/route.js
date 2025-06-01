import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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

    const { data: contracts, error: contractError } = await supabase
      .from('contract')
      .select(`
        id, created_at, accepted_at, pickup_at, delivered_at, cancelled_at,
        pickup_location, pickup_location_geo, drop_off_location, drop_off_location_geo,
        contract_status_id, contract_status(status_name),
        airline_id, delivery_id, delivery_charge,
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