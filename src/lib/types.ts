export type CarStatus = 'Empty' | 'En Route' | 'Occupied' | 'Returning';

export interface Guest {
  id: string;
  full_name: string;
  phone: string;
  notes?: string | null;
  has_arrival: boolean;
  arrival_flight?: string | null;
  arrival_airline?: string | null;
  arrival_date?: string | null;
  arrival_time?: string | null;
  arrival_car_id?: string | null;
  group_size: number;
  table_name?: string | null;
  has_departure: boolean;
  departure_flight?: string | null;
  departure_airline?: string | null;
  departure_date?: string | null;
  departure_time?: string | null;
  departure_car_id?: string | null;
  created_at: string;
}

export interface Car {
  id: string;
  label: string;
  model?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  status: CarStatus;
  capacity: number;
  created_at: string;
}

export interface GuestGroup {
  key: string;
  guests: Guest[];
  direction: 'arrival' | 'departure';
  anchor: Date;
  assignedCarId: string | null;
}
