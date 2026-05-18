import { NextRequest, NextResponse } from 'next/server';
import { createWaiver } from '@/lib/db';

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { id, customerName, customerEmail, waivers } = body;
  if (!id || !customerName || !customerEmail || !waivers?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
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
