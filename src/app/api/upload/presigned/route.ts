import { NextRequest, NextResponse } from 'next/server';
import { createUploadSignedUrl } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, type, ext } = await request.json();

    if (!bookingId || !type) {
      return NextResponse.json({ error: 'Missing bookingId or type' }, { status: 400 });
    }

    const allowedTypes = ['video', 'id-photo', 'boater-id', 'signature', 'safety-signature', 'guardian-signature'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    const extension = ext || (type === 'video' ? 'webm' : 'png');
    const storagePath = `${bookingId}/${type}_${Date.now()}.${extension}`;

    const result = await createUploadSignedUrl(storagePath);
    if (!result) {
      return NextResponse.json({ error: 'Could not create upload URL — database not configured' }, { status: 500 });
    }

    return NextResponse.json({
      uploadUrl: result.signedUrl,
      token: result.token,
      storagePath: storagePath,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
