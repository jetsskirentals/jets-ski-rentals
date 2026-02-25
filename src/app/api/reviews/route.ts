import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all');

  if (all === 'true') {
    return NextResponse.json({ reviews: store.reviews });
  }

  // Public: only approved reviews
  return NextResponse.json({ reviews: store.reviews.filter(r => r.approved) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customerName, rating, comment } = body;

  if (!customerName || !rating || !comment) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const review = {
    id: `rv-${generateId()}`,
    customerName,
    rating: Math.min(5, Math.max(1, rating)),
    comment,
    date: new Date().toISOString().split('T')[0],
    approved: false, // Requires admin approval
  };

  store.reviews.push(review);
  return NextResponse.json({ review }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, approved } = body;

  const review = store.reviews.find(r => r.id === id);
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  if (typeof approved === 'boolean') review.approved = approved;

  return NextResponse.json({ review });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const idx = store.reviews.findIndex(r => r.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  store.reviews.splice(idx, 1);
  return NextResponse.json({ success: true });
}
