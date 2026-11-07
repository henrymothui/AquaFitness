# AquaFitness

Booking site for a small aquafitness studio. Visitors can see the week, special classes, class images, and pack prices. The studio desk records customers, discounts, and bookings. A class stops at its spot limit (10 by default). A pack stops when its credits are used up.

The local demo login uses Supabase-backed demo account and session records. Use `user` / `1234` for the member portal or `admin` / `1234` for the studio desk. Booking checkout records the member's bookings and credits in Supabase; there is no online payment processor.

## Run locally

1. Start Docker.
2. `supabase start`
3. Copy `API_URL` and `SERVICE_ROLE_KEY` from `supabase status` into `.env.local` as `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. See `.env.example`.
4. `npm run dev`

The public site is at http://localhost:3000. Sign in at http://localhost:3000/login to use the member or studio demo account.

The demo accounts use a shared demo password and are intended for local development only. `SUPABASE_SECRET_KEY` stays on the server.
