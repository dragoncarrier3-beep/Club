# Venari Esports — club website & admin demo

A working demonstration of a multi-club esports website with a full admin CMS, built with Next.js (App Router), TypeScript and Tailwind CSS.

The admin genuinely drives the public site: publish an article, add a player, change a kit number, add an event or a product, and the public pages update immediately.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel choose **Add New → Project** and import the repository.
3. Keep the defaults (framework: Next.js) and press **Deploy**.

No environment variables or external accounts are needed.

## Demo accounts

Open **Log in** on the site, or go to `/admin`, and use the one-click buttons. All demo accounts also accept the password `demo1234`.

| Role        | Email               | Can do                                   |
| ----------- | ------------------- | ---------------------------------------- |
| Member      | member@venari.demo  | Open the Tactics Centre                  |
| Club Admin  | admin@venari.demo   | Manage everything for Venari             |
| Super Admin | super@venari.demo   | Manage every club, add clubs             |

## Suggested 5–7 minute walkthrough

1. **Homepage** (`/venari`) — online banner, news, calendar, league position, last five results, season leaders, donation progress.
2. **Squad → Jay “VEX” Morgan** — kit number, season stats, form, match history.
3. **Admin → Squad** — add a player (manually or *Add from stats provider*), try a kit number that is already taken, then pick a free one. Check the public squad page.
4. **Admin → News** — create and publish an article, then return to the homepage.
5. **Admin → Events** — add an event and see it in the public calendar.
6. **History** — open the FIFA 17 tile.
7. **Trial application** — submit the form, then open **Admin → Trials** and change its status.
8. **Tactics** — visit as a visitor (blocked), then sign in as Member.
9. **Shop** — add the home jersey to the basket, complete the test checkout, then open **Admin → Orders** and mark it Processing.
10. **Other clubs** — switch between Venari, Goytre and Aeternum using the crests in the top bar.
11. **Admin → Statistics** — flip the club between online and offline.

Tip: open the admin in one browser tab and the public site in another — changes sync across tabs.

## What is real and what is a stand-in

This is a demonstration build designed to run with zero configuration. Everything visible works end to end, but four services use labelled stand-ins:

| Area       | In this demo                                                                 | In the production build                              |
| ---------- | ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| Database   | Seeded data stored in the visitor's browser (`localStorage`)                 | Supabase PostgreSQL with Row Level Security          |
| Auth       | Demo accounts and browser session; registered passwords are SHA-256 hashed   | Supabase Auth, server-side role checks               |
| Payments   | Simulated checkout screen clearly marked as test mode                        | Stripe Checkout + verified webhooks                  |
| Email      | Notifications are generated and logged as “Demo delivery — not sent”         | Resend (or similar) transactional email              |
| Statistics | `DemoStatsProvider` with deterministic data, labelled “Demo statistics”      | `LiveStatsProvider` against the club's EA FC source  |

Because data lives in the browser, each visitor gets a private sandbox: the client can create, edit and delete freely without affecting anyone else. **Admin → Settings → Reset demo data** restores the original content.

Access rules (members-only tactics, admin-only pages, per-club admin scope) are enforced in the application layer here. In production the same rules are enforced server-side and by database policies so protected rows never leave the server.

## Connecting real statistics

All pages read statistics through one interface in [`lib/stats.ts`](lib/stats.ts):

```ts
interface StatsProvider {
  getClub(); getClubStatus(); getLeaderboard(); getRecentMatches(limit);
  getPlayers(); getPlayerStats(eaId); getSeasonLeaders(); getClubStats();
}
```

- `DemoStatsProvider` is used when nothing is configured.
- Set `NEXT_PUBLIC_STATS_API_URL` and `LiveStatsProvider` is used instead. It calls `{URL}/clubs/{slug}/{resource}` and, if a request fails, falls back to the last cached response and then to demo data, so a stats outage never breaks a page.

To connect the client's real EA FC source, adapt the eight methods of `LiveStatsProvider` to that API's response shapes. No page or component changes are required.

## Project structure

```
app/[club]/…        Public site — one template, any club (venari, goytre, aeternum)
app/admin/…         Admin dashboard and 17 management sections
components/         UI kit, artwork/fallbacks, pitch, checkout
components/admin/   Reusable CRUD engine and admin sections
lib/seed.ts         All sample data
lib/store.tsx       Data store, auth, audit log
lib/stats.ts        Statistics provider architecture
lib/kit.ts          Kit-number rules
```
