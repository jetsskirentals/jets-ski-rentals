import { NextRequest, NextResponse } from 'next/server';
import { getReviews, createReview, updateReview, deleteReview } from '@/lib/db';
import { generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === 'true';
  const reviews = await getReviews(all);
  return NextResponse.json({ reviews });
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
    approved: false,
  };

  await createReview(review);
  return NextResponse.json({ review }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, approved } = body;

  const review = await updateReview(id, approved);
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  return NextResponse.json({ review });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const deleted = await deleteReview(id);
  if (!deleted) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
