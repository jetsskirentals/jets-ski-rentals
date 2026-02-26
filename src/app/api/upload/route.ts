import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string;
    const bookingId = formData.get('bookingId') as string;

    if (!file || !type || !bookingId) {
      return NextResponse.json({ error: 'Missing file, type, or bookingId' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes: Record<string, string[]> = {
      'id-photo': ['image/jpeg', 'image/png', 'image/webp'],
      'boater-id': ['image/jpeg', 'image/png', 'image/webp'],
      'signature': ['image/png', 'image/jpeg'],
      'safety-signature': ['image/png', 'image/jpeg'],
      'guardian-signature': ['image/png', 'image/jpeg'],
    };

    const allowed = allowedTypes[type];
    if (!allowed) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type. Allowed: ${allowed.join(', ')}` }, { status: 400 });
    }

    // Max 5MB for images
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const storagePath = `${bookingId}/${type}_${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(storagePath, buffer, file.type);

    if (!result) {
      return NextResponse.json({ error: 'Upload failed — database not configured' }, { status: 500 });
    }

    return NextResponse.json({ path: result });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
