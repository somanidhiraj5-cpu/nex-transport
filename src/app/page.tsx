'use client';

import { useState } from 'react';

interface FormData {
  full_name: string;
  phone: string;
  group_size: number;
  table_name: string;
  notes: string;
  has_arrival: boolean;
  arrival_flight: string;
  arrival_airline: string;
  arrival_date: string;
  arrival_time: string;
  has_departure: boolean;
  departure_flight: string;
  departure_airline: string;
  departure_date: string;
  departure_time: string;
}

const empty: FormData = {
  full_name: '',
  phone: '',
  group_size: 1,
  table_name: '',
  notes: '',
  has_arrival: false,
  arrival_flight: '',
  arrival_airline: '',
  arrival_date: '',
  arrival_time: '',
  has_departure: false,
  departure_flight: '',
  departure_airline: '',
  departure_date: '',
  departure_time: '',
};

export default function GuestForm() {
  const [form, setForm] = useState<FormData>(empty);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (field: keyof FormData, value: string | boolean | number) =>
    setForm(f => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.has_arrival && !form.has_departure) {
      setErrorMsg('Please select at least one option below.');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? 'Something went wrong');
      }
      setStatus('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re registered!</h2>
          <p className="text-slate-500 leading-relaxed">
            We&apos;ll arrange your ride and let you know the details closer to the event. No further action needed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">✈️</span>
            <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">Airport Transport</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Need a ride?</h1>
          <p className="text-slate-500 mt-1.5">Fill this out and we&apos;ll handle the rest.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div>
            <label className={lbl}>Your Name</label>
            <input
              type="text" required value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder="Jane Smith" className={inp}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={lbl}>Phone Number</label>
            <input
              type="tel" required value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="+1 555 000 0000" className={inp}
            />
          </div>

          {/* Group size + Table — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>
                People travelling with you
                <span className="block text-xs font-normal text-slate-400">Including yourself</span>
              </label>
              <input
                type="number" min={1} max={20} required
                value={form.group_size}
                onChange={e => set('group_size', Math.max(1, Number(e.target.value)))}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>
                Table Name &amp; Number
                <span className="block text-xs font-normal text-slate-400">e.g. Rose 12</span>
              </label>
              <input
                type="text" value={form.table_name}
                onChange={e => set('table_name', e.target.value)}
                placeholder="Rose 12" className={inp}
              />
            </div>
          </div>

          {/* Direction */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">
              What do you need? <span className="text-red-400">*</span>
            </p>
            <div className="space-y-3">
              <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.has_arrival ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input
                  type="checkbox" checked={form.has_arrival}
                  onChange={e => set('has_arrival', e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0"
                />
                <div>
                  <p className="font-semibold text-slate-800">Pickup — Saturday</p>
                  <p className="text-sm text-slate-500">Airport → Hotel</p>
                </div>
              </label>

              <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.has_departure ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input
                  type="checkbox" checked={form.has_departure}
                  onChange={e => set('has_departure', e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-amber-500 shrink-0"
                />
                <div>
                  <p className="font-semibold text-slate-800">Drop-off — Sunday</p>
                  <p className="text-sm text-slate-500">Hotel → Airport</p>
                </div>
              </label>
            </div>
          </div>

          {/* Arrival details */}
          {form.has_arrival && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-3 border border-blue-100">
              <p className="text-sm font-semibold text-blue-700">Saturday flight details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lblSm}>Airline</label>
                  <input type="text" required={form.has_arrival} value={form.arrival_airline}
                    onChange={e => set('arrival_airline', e.target.value)} placeholder="Delta" className={inpSm} />
                </div>
                <div>
                  <label className={lblSm}>Flight No.</label>
                  <input type="text" required={form.has_arrival} value={form.arrival_flight}
                    onChange={e => set('arrival_flight', e.target.value)} placeholder="DL 123" className={inpSm} />
                </div>
              </div>
              <div>
                <label className={lblSm}>Lands at</label>
                <input type="time" required={form.has_arrival} value={form.arrival_time}
                  onChange={e => set('arrival_time', e.target.value)} className={inpSm} />
              </div>
            </div>
          )}

          {/* Departure details */}
          {form.has_departure && (
            <div className="bg-amber-50 rounded-xl p-4 space-y-3 border border-amber-100">
              <p className="text-sm font-semibold text-amber-700">Sunday flight details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lblSm}>Airline</label>
                  <input type="text" required={form.has_departure} value={form.departure_airline}
                    onChange={e => set('departure_airline', e.target.value)} placeholder="United" className={inpSm} />
                </div>
                <div>
                  <label className={lblSm}>Flight No.</label>
                  <input type="text" required={form.has_departure} value={form.departure_flight}
                    onChange={e => set('departure_flight', e.target.value)} placeholder="UA 456" className={inpSm} />
                </div>
              </div>
              <div>
                <label className={lblSm}>Departs at</label>
                <input type="time" required={form.has_departure} value={form.departure_time}
                  onChange={e => set('departure_time', e.target.value)} className={inpSm} />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={lbl}>
              Anything we should know?{' '}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="e.g. wheelchair needed, lots of luggage…"
              className={`${inp} resize-none`}
            />
          </div>

          {errorMsg && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-3 border border-red-100">
              {errorMsg}
            </p>
          )}

          <button
            type="submit" disabled={status === 'submitting'}
            className="w-full bg-slate-900 hover:bg-slate-700 active:bg-slate-800 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-base transition-colors"
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit'}
          </button>

          <p className="text-center text-xs text-slate-400 pb-4">
            Your details are only visible to the coordinator.
          </p>
        </form>
      </div>
    </main>
  );
}

const lbl  = 'block text-sm font-semibold text-slate-700 mb-1.5';
const lblSm = 'block text-xs font-medium text-slate-600 mb-1';
const inp  = 'w-full rounded-lg border border-slate-200 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white';
const inpSm = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white';
