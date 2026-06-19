import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await db.cars.all());
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { label, model, driver_name, driver_phone, capacity } = await req.json();
  if (!label?.trim()) return NextResponse.json({ error: 'Label required' }, { status: 400 });

  const car = await db.cars.insert({
    label: label.trim(),
    model: model?.trim() || null,
    driver_name: driver_name?.trim() || null,
    driver_phone: driver_phone?.trim() || null,
    capacity: Number(capacity) || 4,
    status: 'Empty',
  });
  return NextResponse.json(car, { status: 201 });
}
