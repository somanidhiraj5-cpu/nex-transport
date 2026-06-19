# Nex Transport — Setup Guide

## 1. Create a Supabase project (free)

1. Go to https://supabase.com and sign up / log in.
2. Click **New Project**, give it a name (e.g. "nex-transport"), choose a region close to you.
3. Wait ~2 min for it to provision.
4. In the left sidebar go to **SQL Editor** and paste the contents of `supabase-schema.sql`, then click **Run**.

## 2. Get your Supabase credentials

In the Supabase dashboard → **Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## 3. Set environment variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PASSWORD=YourChosenPassword
ADMIN_SECRET=any-random-64-char-string
```

Generate ADMIN_SECRET: run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` in your terminal.

## 4. Install & run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — guest form.
Open http://localhost:3000/admin — admin dashboard (login with your ADMIN_PASSWORD).

## 5. Deploy to Vercel (one click)

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com, import the repo.
3. In **Environment Variables**, add all 5 vars from `.env.local`.
4. Deploy. Done.

Vercel gives you:
- **Guest form** → `https://your-app.vercel.app/`
- **Admin dashboard** → `https://your-app.vercel.app/admin`

Share the root URL with guests in your group chat. Keep the /admin URL for yourself.

## Usage notes

- **Group window slider**: adjust the grouping window (5–120 min). Groups update instantly.
- **Assign car**: use the dropdown on each group card. Saves immediately.
- **Car status**: click the status buttons (Empty / En Route / Occupied / Returning) to update live.
- **Add car**: click "+ Add car" in the fleet panel — fill in as little or as much as you know.
- **Auto-refresh**: the admin dashboard polls every 8 seconds — new guest submissions appear automatically.
- **Tabs**: Saturday Arrivals and Sunday Departures are separate tabs.
- **All guests**: expand the "All guests" accordion at the bottom of the fleet panel for a raw list.
