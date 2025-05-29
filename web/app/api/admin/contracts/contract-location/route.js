import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const contractId = searchParams.get('contractId');

  if (!contractId) {
    return NextResponse.json(
      { error: 'Missing contractId' },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

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

  // Ensure we return a consistent structure
  return NextResponse.json({ 
    data: {
      current_location_geo: data.current_location_geo || null
    }
  });
} 