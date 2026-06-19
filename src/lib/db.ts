/**
 * Auto-detects environment:
 *   - If NEXT_PUBLIC_SUPABASE_URL is set → uses Supabase (production / Vercel)
 *   - Otherwise → uses local JSON files (local dev, no setup needed)
 */

import type { Guest, Car } from './types';

// ── Local JSON fallback (dev only) ──────────────────────────────────────────

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DIR = path.join(process.cwd(), 'data');

function ensure() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}
function readFile<T>(file: string): T[] {
  ensure();
  const p = path.join(DIR, file);
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return []; }
}
function writeFile<T>(file: string, data: T[]) {
  ensure();
  fs.writeFileSync(path.join(DIR, file), JSON.stringify(data, null, 2), 'utf-8');
}

const localDb = {
  guests: {
    async all(): Promise<Guest[]> {
      return readFile<Guest>('guests.json').sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    },
    async insert(row: Omit<Guest, 'id' | 'created_at'>): Promise<Guest> {
      const list = readFile<Guest>('guests.json');
      const g: Guest = { ...row, id: randomUUID(), created_at: new Date().toISOString() };
      writeFile('guests.json', [...list, g]);
      return g;
    },
    async updateMany(ids: string[], patch: Partial<Guest>) {
      writeFile('guests.json', readFile<Guest>('guests.json').map(g => ids.includes(g.id) ? { ...g, ...patch } : g));
    },
  },
  cars: {
    async all(): Promise<Car[]> {
      return readFile<Car>('cars.json').sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    },
    async insert(row: Omit<Car, 'id' | 'created_at'>): Promise<Car> {
      const list = readFile<Car>('cars.json');
      const c: Car = { ...row, id: randomUUID(), created_at: new Date().toISOString() };
      writeFile('cars.json', [...list, c]);
      return c;
    },
    async update(id: string, patch: Partial<Car>) {
      writeFile('cars.json', readFile<Car>('cars.json').map(c => c.id === id ? { ...c, ...patch } : c));
    },
    async delete(id: string) {
      writeFile('cars.json', readFile<Car>('cars.json').filter(c => c.id !== id));
      writeFile('guests.json', readFile<Guest>('guests.json').map(g => ({
        ...g,
        arrival_car_id: g.arrival_car_id === id ? null : g.arrival_car_id,
        departure_car_id: g.departure_car_id === id ? null : g.departure_car_id,
      })));
    },
  },
};

// ── Supabase (production) ───────────────────────────────────────────────────

function makeSupabaseDb() {
  // Dynamic import so Supabase package isn't required in local-only installs
  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  return {
    guests: {
      async all(): Promise<Guest[]> {
        const { data } = await client.from('guests').select('*').order('created_at', { ascending: true });
        return data ?? [];
      },
      async insert(row: Omit<Guest, 'id' | 'created_at'>): Promise<Guest> {
        const { data } = await client.from('guests').insert(row).select().single();
        return data!;
      },
      async updateMany(ids: string[], patch: Partial<Guest>) {
        await client.from('guests').update(patch).in('id', ids);
      },
    },
    cars: {
      async all(): Promise<Car[]> {
        const { data } = await client.from('cars').select('*').order('created_at', { ascending: true });
        return data ?? [];
      },
      async insert(row: Omit<Car, 'id' | 'created_at'>): Promise<Car> {
        const { data } = await client.from('cars').insert(row).select().single();
        return data!;
      },
      async update(id: string, patch: Partial<Car>) {
        await client.from('cars').update(patch).eq('id', id);
      },
      async delete(id: string) {
        await client.from('guests').update({ arrival_car_id: null }).eq('arrival_car_id', id);
        await client.from('guests').update({ departure_car_id: null }).eq('departure_car_id', id);
        await client.from('cars').delete().eq('id', id);
      },
    },
  };
}

// ── Export the right one ────────────────────────────────────────────────────

export const db = process.env.NEXT_PUBLIC_SUPABASE_URL ? makeSupabaseDb() : localDb;
