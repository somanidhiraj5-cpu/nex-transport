'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Guest, Car, CarStatus, GuestGroup } from '@/lib/types';
import { groupByTime, fmt12 } from '@/lib/grouping';

const STATUS_COLORS: Record<CarStatus, string> = {
  Empty:      'bg-green-100 text-green-800 border-green-200',
  'En Route': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Occupied:   'bg-orange-100 text-orange-800 border-orange-200',
  Returning:  'bg-blue-100 text-blue-800 border-blue-200',
};
const ALL_STATUSES: CarStatus[] = ['Empty', 'En Route', 'Occupied', 'Returning'];

export default function AdminDashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [cars, setCars]     = useState<Car[]>([]);
  const [tab, setTab]       = useState<'arrival' | 'departure'>('arrival');
  const [windowMin, setWindowMin] = useState(30);
  const [loading, setLoading]     = useState(true);
  const [addCarOpen, setAddCarOpen]   = useState(false);
  const [editCarId, setEditCarId]     = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [gRes, cRes] = await Promise.all([fetch('/api/guests'), fetch('/api/cars')]);
    if (gRes.ok) setGuests(await gRes.json());
    if (cRes.ok) setCars(await cRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 8000);
    return () => clearInterval(id);
  }, [fetchData]);

  const groups = groupByTime(guests, tab, windowMin);
  const arrCount = guests.filter(g => g.has_arrival).length;
  const depCount = guests.filter(g => g.has_departure).length;

  async function assignCar(group: GuestGroup, carId: string | null) {
    const res = await fetch('/api/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestIds: group.guests.map(g => g.id), carId, direction: group.direction }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      alert(`Assignment failed: ${error}`);
      return;
    }
    await fetchData();
  }

  async function updateCarStatus(carId: string, status: CarStatus) {
    await fetch(`/api/cars/${carId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchData();
  }

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' });
    globalThis.location.href = '/admin/login';
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>;
  }

  const emptyCars = cars.filter(c => c.status === 'Empty');

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">✈️</span>
            <span className="font-bold text-slate-900">Transport Coordinator</span>
          </div>
          <div className="flex items-center gap-3">
            {emptyCars.length > 0 && (
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                {emptyCars.length} car{emptyCars.length > 1 ? 's' : ''} available
              </span>
            )}
            <span className="text-xs text-slate-400">{guests.length} guests total</span>
            <button onClick={fetchData} className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded px-2 py-1">↻</button>
            <button onClick={logout} className="text-xs text-slate-400 hover:text-slate-700">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-5 lg:flex lg:gap-6">

        {/* Left: groups */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <TabBtn active={tab === 'arrival'} color="blue" onClick={() => setTab('arrival')}>
              ↓ Saturday Pickup
              <Pill color="blue">{arrCount}</Pill>
            </TabBtn>
            <TabBtn active={tab === 'departure'} color="amber" onClick={() => setTab('departure')}>
              ↑ Sunday Drop-off
              <Pill color="amber">{depCount}</Pill>
            </TabBtn>
          </div>

          {/* Window control */}
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-4">
            <span className="text-sm text-slate-600 whitespace-nowrap">Group people within</span>
            <input
              type="range" min={5} max={120} step={5} value={windowMin}
              onChange={e => setWindowMin(Number(e.target.value))}
              className="flex-1 accent-slate-800"
            />
            <span className="text-sm font-bold text-slate-800 w-16 text-right whitespace-nowrap">{windowMin} min</span>
            <span className="text-xs text-slate-400 hidden sm:block">{groups.filter(g => g.key !== 'no-time').length} groups</span>
          </div>

          {/* Groups */}
          {groups.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400">
              No {tab === 'arrival' ? 'arrivals' : 'departures'} yet.
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group, idx) => (
                <GroupCard
                  key={group.key}
                  group={group}
                  index={idx}
                  cars={cars}
                  tab={tab}
                  onAssign={carId => assignCar(group, carId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: cars */}
        <aside className="mt-5 lg:mt-0 lg:w-64 xl:w-72 shrink-0 space-y-4">

          {/* Cars */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">Cars ({cars.length})</span>
              <button onClick={() => setAddCarOpen(true)} className="text-xs font-medium text-blue-600 hover:text-blue-700">+ Add</button>
            </div>
            {cars.length === 0 ? (
              <p className="text-slate-400 text-sm p-4 text-center">No cars yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {cars.map(car => (
                  <CarRow
                    key={car.id}
                    car={car}
                    onStatusChange={s => updateCarStatus(car.id, s)}
                    onEdit={() => setEditCarId(car.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* All guests */}
          <details className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <summary className="px-4 py-3 text-sm font-semibold text-slate-700 cursor-pointer select-none">
              All guests ({guests.length})
            </summary>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {guests.length === 0 ? (
                <p className="text-slate-400 text-sm p-4">None yet.</p>
              ) : (
                guests.slice().reverse().map(g => (
                  <div key={g.id} className="px-4 py-2.5">
                    <p className="text-sm font-medium text-slate-800">{g.full_name}</p>
                    <p className="text-xs text-slate-500">{g.phone}</p>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      {g.has_arrival && <span className="text-xs text-blue-600">↓ {fmt12(g.arrival_time)}</span>}
                      {g.has_departure && <span className="text-xs text-amber-600">↑ {fmt12(g.departure_time)}</span>}
                      {(g.group_size ?? 1) > 1 && <span className="text-xs text-purple-600">👥 {g.group_size}</span>}
                      {g.table_name && <span className="text-xs text-slate-500">🪑 {g.table_name}</span>}
                    </div>
                    {g.notes && <p className="text-xs text-slate-400 italic mt-0.5">{g.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </details>
        </aside>
      </div>

      {addCarOpen && (
        <AddCarModal
          nextLabel={`Car ${cars.length + 1}`}
          onClose={() => setAddCarOpen(false)}
          onSaved={() => { setAddCarOpen(false); fetchData(); }}
        />
      )}
      {editCarId && (
        <EditCarModal
          car={cars.find(c => c.id === editCarId)!}
          onClose={() => setEditCarId(null)}
          onSaved={() => { setEditCarId(null); fetchData(); }}
          onDeleted={() => { setEditCarId(null); fetchData(); }}
        />
      )}
    </div>
  );
}

// ── Group card ──────────────────────────────────────────────────────────────

function GroupCard({ group, index, cars, tab, onAssign }: {
  group: GuestGroup; index: number; cars: Car[];
  tab: 'arrival' | 'departure'; onAssign: (id: string | null) => void;
}) {
  const isNoTime = group.key === 'no-time';
  const assignedCar = cars.find(c => c.id === group.assignedCarId);
  const accent = tab === 'arrival' ? 'border-l-blue-400' : 'border-l-amber-400';

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${accent} overflow-hidden`}>
      {/* Group header */}
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap border-b border-slate-100">
        <span className="font-bold text-slate-800">
          {isNoTime ? 'No time given' : `Group ${index + 1}`}
        </span>
        {!isNoTime && (
          <span className="text-slate-500 text-sm">
            around <strong>{fmt12(group.anchor.toTimeString().slice(0, 5))}</strong>
          </span>
        )}
        {(() => {
          const totalPeople = group.guests.reduce((sum, g) => sum + (g.group_size ?? 1), 0);
          const guestCount = group.guests.length;
          return (
            <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5">
              {guestCount} {guestCount === 1 ? 'booking' : 'bookings'} · {totalPeople} {totalPeople === 1 ? 'seat' : 'seats'}
            </span>
          );
        })()}
      </div>

      {/* Guest rows */}
      <div className="divide-y divide-slate-50">
        {group.guests.map(g => {
          const isArr = group.direction === 'arrival';
          const time    = isArr ? g.arrival_time    : g.departure_time;
          const flight  = isArr ? g.arrival_flight  : g.departure_flight;
          const airline = isArr ? g.arrival_airline : g.departure_airline;
          return (
            <div key={g.id} className="px-4 py-2.5 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-800 text-sm">{g.full_name}</p>
                  {(g.group_size ?? 1) > 1 && (
                    <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 font-medium">
                      👥 {g.group_size} people
                    </span>
                  )}
                  {g.table_name && (
                    <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                      🪑 {g.table_name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{g.phone}</p>
                {g.notes && <p className="text-xs text-slate-400 italic mt-0.5">{g.notes}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-slate-700">{fmt12(time)}</p>
                <p className="text-xs text-slate-400">{airline} {flight}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignment bar */}
      <div className="px-4 py-3 bg-slate-50 flex items-center gap-3 flex-wrap">
        <select
          value={group.assignedCarId ?? ''}
          onChange={e => onAssign(e.target.value || null)}
          className="flex-1 min-w-[140px] text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
        >
          <option value="">— Assign a car —</option>
          {cars.map(car => (
            <option key={car.id} value={car.id}>
              {car.label}{car.driver_name ? ` · ${car.driver_name}` : ''} [{car.status}] {car.capacity} seats
            </option>
          ))}
        </select>
        {assignedCar && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[assignedCar.status]}`}>
            {assignedCar.label} · {assignedCar.status}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Car row ─────────────────────────────────────────────────────────────────

function CarRow({ car, onStatusChange, onEdit }: {
  car: Car; onStatusChange: (s: CarStatus) => void; onEdit: () => void;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-slate-800 text-sm">{car.label}
            {car.model && <span className="font-normal text-slate-400 ml-1.5 text-xs">{car.model}</span>}
          </p>
          {car.driver_name && (
            <p className="text-xs text-slate-500">{car.driver_name}{car.driver_phone && ` · ${car.driver_phone}`}</p>
          )}
          <p className="text-xs text-slate-400">{car.capacity} seats</p>
        </div>
        <button onClick={onEdit} className="text-xs text-slate-400 hover:text-slate-600 shrink-0">Edit</button>
      </div>
      {/* Status buttons */}
      <div className="flex gap-1 flex-wrap">
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              car.status === s ? STATUS_COLORS[s] : 'border-slate-200 text-slate-400 bg-white hover:border-slate-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Add Car Modal ────────────────────────────────────────────────────────────

function AddCarModal({ nextLabel, onClose, onSaved }: { nextLabel: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ label: nextLabel, model: '', driver_name: '', driver_phone: '', capacity: 4 });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/cars', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    onSaved();
  }

  return (
    <Modal title="Add Car" onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <MF label="Label *"><input required className={mi} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} /></MF>
        <MF label="Model"><input className={mi} placeholder="e.g. Honda Odyssey (white)" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} /></MF>
        <MF label="Driver Name"><input className={mi} value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} /></MF>
        <MF label="Driver Phone"><input className={mi} type="tel" value={form.driver_phone} onChange={e => setForm(f => ({ ...f, driver_phone: e.target.value }))} /></MF>
        <MF label="Seats"><input className={mi} type="number" min={1} max={20} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} /></MF>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-50">{saving ? '…' : 'Add Car'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Car Modal ───────────────────────────────────────────────────────────

function EditCarModal({ car, onClose, onSaved, onDeleted }: { car: Car; onClose: () => void; onSaved: () => void; onDeleted: () => void }) {
  const [form, setForm] = useState({ label: car.label, model: car.model ?? '', driver_name: car.driver_name ?? '', driver_phone: car.driver_phone ?? '', capacity: car.capacity });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/cars/${car.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    onSaved();
  }

  async function del() {
    if (!confirm(`Delete ${car.label}?`)) return;
    await fetch(`/api/cars/${car.id}`, { method: 'DELETE' });
    onDeleted();
  }

  return (
    <Modal title={`Edit ${car.label}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <MF label="Label *"><input required className={mi} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} /></MF>
        <MF label="Model"><input className={mi} value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} /></MF>
        <MF label="Driver Name"><input className={mi} value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} /></MF>
        <MF label="Driver Phone"><input className={mi} type="tel" value={form.driver_phone} onChange={e => setForm(f => ({ ...f, driver_phone: e.target.value }))} /></MF>
        <MF label="Seats"><input className={mi} type="number" min={1} max={20} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} /></MF>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={del} className="py-2 px-3 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50">Delete</button>
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-50">{saving ? '…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function TabBtn({ active, color, onClick, children }: { active: boolean; color: 'blue' | 'amber'; onClick: () => void; children: React.ReactNode }) {
  const activeClass = color === 'blue' ? 'bg-blue-600 text-white shadow' : 'bg-amber-500 text-white shadow';
  return (
    <button onClick={onClick} className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${active ? activeClass : 'text-slate-500 hover:text-slate-700'}`}>
      {children}
    </button>
  );
}

function Pill({ color, children }: { color: 'blue' | 'amber'; children: React.ReactNode }) {
  return (
    <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${color === 'blue' ? 'bg-blue-500 text-white' : 'bg-amber-400 text-white'}`}>
      {children}
    </span>
  );
}

function MF({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>{children}</div>;
}

const mi = 'w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white';
