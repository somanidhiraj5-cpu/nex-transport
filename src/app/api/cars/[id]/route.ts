import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';
import type { CarStatus } from '@/lib/types';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const allowed = ['label', 'model', 'driver_name', 'driver_phone', 'capacity', 'status'];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];
  await db.cars.update(id, patch as { status?: CarStatus; capacity?: number; label?: string });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await db.cars.delete(id);
  return NextResponse.json({ ok: true });
}
