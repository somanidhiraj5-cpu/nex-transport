import type { Guest, GuestGroup } from './types';

function toDate(date: string | null | undefined, time: string | null | undefined): Date | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}`);
  return isNaN(d.getTime()) ? null : d;
}

export function groupByTime(
  guests: Guest[],
  direction: 'arrival' | 'departure',
  windowMinutes: number,
): GuestGroup[] {
  const relevant = guests.filter(g =>
    direction === 'arrival' ? g.has_arrival : g.has_departure,
  );

  type Timed = { guest: Guest; dt: Date };
  const timed: Timed[] = [];
  const noTime: Guest[] = [];

  for (const g of relevant) {
    const dt =
      direction === 'arrival'
        ? toDate(g.arrival_date, g.arrival_time)
        : toDate(g.departure_date, g.departure_time);
    if (dt) timed.push({ guest: g, dt });
    else noTime.push(g);
  }

  timed.sort((a, b) => a.dt.getTime() - b.dt.getTime());

  const windowMs = windowMinutes * 60 * 1000;
  const groups: GuestGroup[] = [];

  for (const { guest, dt } of timed) {
    let placed = false;
    for (const grp of groups) {
      if (dt.getTime() - grp.anchor.getTime() <= windowMs) {
        grp.guests.push(guest);
        placed = true;
        break;
      }
    }
    if (!placed) {
      const carId =
        direction === 'arrival' ? guest.arrival_car_id ?? null : guest.departure_car_id ?? null;
      groups.push({ key: `g-${dt.getTime()}`, guests: [guest], direction, anchor: dt, assignedCarId: carId });
    }
  }

  // Recalculate assignedCarId as the majority car among group guests
  for (const grp of groups) {
    const counts: Record<string, number> = {};
    for (const g of grp.guests) {
      const id = direction === 'arrival' ? g.arrival_car_id : g.departure_car_id;
      if (id) counts[id] = (counts[id] ?? 0) + 1;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    grp.assignedCarId = top ? top[0] : null;
  }

  if (noTime.length > 0) {
    groups.push({
      key: 'no-time',
      guests: noTime,
      direction,
      anchor: new Date(0),
      assignedCarId: null,
    });
  }

  return groups;
}

export function fmt12(time: string | null | undefined): string {
  if (!time) return '—';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function fmtDate(date: string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
