# AquaFitness

Booking site for a small aquafitness studio. Visitors can see the weekly class timetable, class images, and pack prices. The studio desk records customers, discounts, and bookings. A class stops at its spot limit (10 by default). A pack stops when its credits are used up.

The studio administrator is stored in the dedicated `admin_accounts` table and can sign in with `admin` / `1234` on a fresh local database. Change that password in Studio → Settings. Members register with email and password. Local sample users are created as Supabase Auth identities with sample bookings and simulated paid credit orders. Booking checkout records bookings and credits in Supabase; there is no online payment processor.

## Run locally

1. Start Docker.
2. `supabase start`
3. Copy `API_URL` and `SERVICE_ROLE_KEY` from `supabase status` into `.env.local` as `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. See `.env.example`.
4. Reset the local database and seed the four sample Auth users: `supabase db reset` then `npm run seed:local`.
5. `npm run dev`

The local sample users share the password `AquaDemo2026!` and use `user1@hydrofit.demo` through `user4@hydrofit.demo`. The seed script refuses non-local Supabase URLs.

Local development uses the Supabase CLI stack at `http://127.0.0.1:54321`. Keep these local values in `.env.local`; do not put the hosted project URL or its secret key there.

## Production on Vercel

Set `SUPABASE_URL` to the hosted Supabase project URL and `SUPABASE_SECRET_KEY` to that project's server-side secret in the Vercel project's Production Environment Variables. Keep the hosted credentials in Vercel and local CLI credentials in `.env.local`. Apply database changes to the hosted project separately when deploying schema updates.

The public site is at http://localhost:3000. Sign in or register at http://localhost:3000/log-in.

`SUPABASE_SECRET_KEY` stays on the server.
