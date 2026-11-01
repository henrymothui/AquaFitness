# AquaFitness

Booking site for a small aquafitness studio. Visitors can see the week, special classes, class images, and pack prices. The studio desk records customers, discounts, and bookings. A class stops at its spot limit (10 by default). A pack stops when its credits are used up.

This version has no login and no online payment.

## Run locally

1. Start Docker.
2. `supabase start`
3. Copy `API_URL` and `SERVICE_ROLE_KEY` from `supabase status` into `.env.local` as `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. See `.env.example`.
4. `npm run dev`

The public site is at http://localhost:3000. The studio desk is at http://localhost:3000/studio.

Do not put the studio desk on the public internet until login is added. `SUPABASE_SECRET_KEY` stays on the server.
