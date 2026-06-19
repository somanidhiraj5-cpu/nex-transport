import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await db.guests.all());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    full_name, phone, group_size, table_name, notes,
    has_arrival, arrival_flight, arrival_airline, arrival_date, arrival_time,
    has_departure, departure_flight, departure_airline, departure_date, departure_time,
  } = body;

  if (!full_name?.trim() || !phone?.trim())
    return NextResponse.json({ error: 'Name and phone are required.' }, { status: 400 });
  if (!has_arrival && !has_departure)
    return NextResponse.json({ error: 'Select at least one option.' }, { status: 400 });

  const guest = await db.guests.insert({
    full_name: full_name.trim(),
    phone: phone.trim(),
    group_size: Number(group_size) || 1,
    table_name: table_name?.trim() || null,
    notes: notes?.trim() || null,
    has_arrival: Boolean(has_arrival),
    arrival_flight: has_arrival ? arrival_flight?.trim() || null : null,
    arrival_airline: has_arrival ? arrival_airline?.trim() || null : null,
    arrival_date: has_arrival ? arrival_date || null : null,
    arrival_time: has_arrival ? arrival_time || null : null,
    arrival_car_id: null,
    has_departure: Boolean(has_departure),
    departure_flight: has_departure ? departure_flight?.trim() || null : null,
    departure_airline: has_departure ? departure_airline?.trim() || null : null,
    departure_date: has_departure ? departure_date || null : null,
    departure_time: has_departure ? departure_time || null : null,
    departure_car_id: null,
  });

  return NextResponse.json({ ok: true, id: guest.id }, { status: 201 });
}
