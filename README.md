# pHavelength (Prototype)

An intentional dating web app prototype built for the eLitmus Software Developer assignment (*"Start up founder of a Dating App"*), aimed at early-career Indian professionals (2020–2023 graduate cohorts).

## Honest Prototype Framing

- **Simulated eLitmus verification:** This prototype does **not** connect to eLitmus's live database. Batch/verification badges are simulated and labeled `"Simulated eLitmus verification (prototype)"` in the UI, designed to plug into eLitmus data later. Company domains are self-declared.
- **Mock paywall:** The `"Unlock 4th Daily Match"` modal is labeled `"Mock paywall, no payment"` and toggles a boolean (`is_plus_mock`) with no real payment charged.
- **Known technical limitations:**
  1. The `profiles` RLS `SELECT` policy allows authenticated users to read profile rows for client-side matching. Production would move matching into a server function or database view returning only safe fields.
  2. Progressive photo unblur uses CSS (`blur-xl` → `blur-md` → `blur-none`), which hides the placeholder avatar visually only. Production would serve pre-blurred images and swap URLs server-side.

## Core Features (6-Piece Scope)

1. **Supabase Auth + Onboarding + DPDP Consent + 18+ Gate + Delete Account + Grievance Contact**
2. **5-Question Compatibility Quiz** (1–5 scale across work-life rhythm, weekend battery, finances, conflict style, and city flexibility)
3. **Privacy Shield** (hides matching `company_domain` and/or `college_name`, showing how many profiles were hidden)
4. **Today's Curated Matches** (top 3 eligible matches computed on open, capped at 3 rows per day in `matches`)
5. **Chat with Progressive Photo Unblur + 4+ Word Rule + Report/Block**
6. **Mock Paywall** (unlocks a 4th daily match slot in the demo)

## Tech Stack

- **Frontend / App:** Next.js 15 (App Router, TypeScript), Tailwind CSS
- **Backend / Database / Auth:** Supabase (Auth + PostgreSQL with Row Level Security)
- **Hosting:** Vercel

## Local Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - Create a project at [supabase.com](https://supabase.com).
   - In **Authentication → Sign In / Up → Email**, turn **Confirm email** OFF so evaluators can sign up and sign in immediately.
   - Open **SQL Editor** and run `supabase/schema.sql`, followed by `supabase/policies.sql`.

3. **Environment variables:**
   Copy `.env.example` to `.env.local` and fill in your Supabase keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-server-only
   ```
   *(Never commit `.env.local`; `SUPABASE_SERVICE_ROLE_KEY` is used only in `src/app/api/delete-account/route.ts` and `scripts/seed.ts`.)*

4. **Seed demo accounts (requires Node 22+):**
   ```bash
   node --experimental-strip-types --env-file=.env.local scripts/seed.ts
   ```

5. **Run locally:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

## Evaluator Demo Accounts

- **Demo 1 (Aarav Sharma):** `aarav@elitmus-demo.in` / `elitmus2026`
- **Demo 2 (Anya Nair):** `anya@elitmus-demo.in` / `elitmus2026`
- **Privacy Shield Test:** `divya@elitmus-demo.in` shares Aarav's `flipkart.com` company domain and is hidden when Privacy Shield is active.

## Disclosures

- **Open-source libraries used:** Next.js, React, Tailwind CSS, `@supabase/supabase-js`, TypeScript.
- **AI usage disclosure:** AI coding assistance was used during planning and code generation, as permitted by the assignment guidelines.
