import { NextRequest, NextResponse } from 'next/server';
import { createWaiver } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { id, customerName, customerEmail, customerPhone, waivers } = body;
  if (!id || !customerName || !customerEmail || !waivers?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const primary = waivers[0];
  if (!primary.signaturePath) {
    return NextResponse.json({ error: 'Waiver signature is required' }, { status: 400 });
  }
  if (!primary.idPhotoPath) {
    return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
  }
  if (!primary.participantDOB) {
    return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 });
  }
  if (!primary.participantAddress) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }
  if (!primary.driversLicenseId) {
    return NextResponse.json({ error: 'Driver\'s license ID is required' }, { status: 400 });
  }

  try {
    // Create a placeholder booking record so the FK constraint on waivers is satisfied
    if (supabase) {
      const { error: bookingError } = await supabase.from('bookings').insert({
        id,
        jet_ski_id: 'waiver-only',
        date: new Date().toISOString().split('T')[0],
        time_slot_id: 'waiver-only',
        start_time: '00:00',
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || '',
        total_price: 0,
        status: 'waiver-only',
        is_manual: false,
      });
      if (bookingError) {
        console.error('waiver-only booking insert error:', bookingError);
        throw new Error(`Failed to create waiver record: ${bookingError.message}`);
      }
    }

    for (const w of waivers) {
      await createWaiver(id, {
        participantDOB: w.participantDOB || '',
        participantAddress: w.participantAddress || '',
        driversLicenseId: w.driversLicenseId || '',
        signaturePath: w.signaturePath,
        idPhotoPath: w.idPhotoPath,
        boaterIdPhotoPath: w.boaterIdPhotoPath,
        liabilityVideoPath: w.liabilityVideoPath,
        safetySignaturePath: w.safetySignaturePath,
        guardianSignaturePath: w.guardianSignaturePath,
        photoVideoOptOut: w.photoVideoOptOut || false,
        isMinor: w.isMinor || false,
        minorName: w.minorName,
        minorAge: w.minorAge,
        guardianName: w.guardianName,
        signedAt: w.signedAt || new Date().toISOString(),
        safetyBriefingSignedAt: w.safetyBriefingSignedAt || new Date().toISOString(),
        driverNumber: w.driverNumber || 0,
        participantName: w.participantName || '',
      });
    }

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save waiver';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
