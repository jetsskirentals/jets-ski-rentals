import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'jetski2026';

// Simple token generation (hash of password + secret)
function generateToken(): string {
  const payload = `admin-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  // Simple base64 encoding as token
  return Buffer.from(payload).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (password === ADMIN_PASSWORD) {
      const token = generateToken();
      const cookieStore = await cookies();
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// Check auth status
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  
  if (token?.value) {
    return NextResponse.json({ authenticated: true });
  }
  
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

// Logout
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  return NextResponse.json({ success: true });
}
