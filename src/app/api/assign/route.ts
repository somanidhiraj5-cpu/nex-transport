import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { guestIds, carId, direction } = await req.json();
  if (!Array.isArray(guestIds) || guestIds.length === 0)
    return NextResponse.json({ error: 'No guest IDs' }, { status: 400 });
  if (direction !== 'arrival' && direction !== 'departure')
    return NextResponse.json({ error: 'Invalid direction' }, { status: 400 });

  const field = direction === 'arrival' ? 'arrival_car_id' : 'departure_car_id';
  await db.guests.updateMany(guestIds, { [field]: carId ?? null });
  return NextResponse.json({ ok: true });
}
