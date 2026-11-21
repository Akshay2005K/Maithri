# pHavelength 

An intentional dating web application built for the **eLitmus Software Developer assignment ("Start up founder of a Dating App")**, designed for early-career Indian graduates (2020–2023 batches, ages ~22–28) in tech-hub cities.

---

## 1. Product Thesis & Honest Prototype Framing

### Problems Targeted
1. **Swipe fatigue & choice overload** → No swipe deck. Users receive up to **3 curated matches per day**, computed when opening the site.
2. **Low-effort `"hey"` openers & superficial photo judgment** → **4+ word minimum** per message and **progressive photo unblur** (`blur-xl` → `blur-md` → `blur-none`) unlocked only through mutual conversation.
3. **Workplace & alumni awkwardness** → **Privacy Shield** that hides candidates sharing the same self-declared `company_domain` or `college_name` and displays `"N profiles hidden by your Privacy Shield"`.
4. **Trust, privacy & safety concerns** → **18+ hard age gate**, **DPDP Act 2023 style explicit consent with stored timestamp**, **Report & Block**, **Delete My Account**, and plain-language **Privacy**, **Terms**, and **Grievance Contact** pages.

### Simulated vs. Real (Honest Disclosures)
- **Simulated eLitmus verification:** This prototype does **not** connect to eLitmus's private candidate database. Batch/verification badges are simulated and explicitly labeled `"Simulated eLitmus verification (prototype)"` in the UI, designed to plug into eLitmus data later. Company domains are self-declared.
- **Mock paywall:** The `"Unlock 4th Daily Match (Mock Paywall)"` modal is labeled `"Mock paywall, no payment"`. Clicking it flips a boolean (`is_plus_mock = true`) on `profiles` with zero real money charged.
- **Illustration avatars only:** All profiles use local geometric/illustrated SVG avatars (`/public/avatars/avatar-1.svg` through `avatar-6.svg`), with no photos of real people.

---

## 2. Tech Stack & Project Structure

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Backend / Auth / Database:** Supabase (Supabase Auth + PostgreSQL with Row Level Security)
- **Hosting:** Vercel

```text
public/
  avatars/
    avatar-1.svg ... avatar-6.svg   # Illustration placeholder avatars
scripts/
  seed.ts                           # Seeds 10 Auth users, profiles, and 1 shared match via Admin API
supabase/
  schema.sql                        # 4 PostgreSQL tables + constraints + cascades
  policies.sql                      # Row Level Security (RLS) rules for all 4 tables
src/
  lib/
    supabase.ts                     # Browser Supabase client (anon key) + Profile type
    supabaseAdmin.ts                # Server-only Supabase client (service-role key)
    matching.ts                     # Candidate filtering, Privacy Shield, scoring, 3/day cap
    unblur.ts                       # 4+ word message validation + blur levels 1–3
  components/
    AuthForm.tsx                    # Email/password Sign In & Sign Up + demo credentials box
    Onboarding.tsx                  # Avatar picker, profile fields, Privacy Shield, 18+ gate, DPDP consent
    Quiz.tsx                        # 5-question compatibility quiz (1–5 scale)
    Matches.tsx                     # Daily curated matches, Privacy Shield counter, mock paywall trigger
    Chat.tsx                        # Polling chat, 4+ word enforcement, unblur bar, Report & Block
    PaywallModal.tsx                # Mock ₹199/mo Plus paywall toggle
  app/
    layout.tsx                      # Root layout + persistent footer (Grievance, Privacy, Terms)
    page.tsx                        # Main state router (Auth -> Onboarding -> Quiz -> Matches <-> Chat + Delete Account)
    api/delete-account/route.ts     # Server-only POST route verifying JWT and deleting auth.users row
    privacy/page.tsx                # Privacy Policy page
    terms/page.tsx                  # Terms of Use page
    grievance/page.tsx              # Grievance & Safety Contact page
```

---

## 3. Complete Functionality & How Every Piece Works

### A. Authentication & Session Handling (`AuthForm.tsx`, `src/lib/supabase.ts`, `src/app/page.tsx`)
- Uses **Supabase Auth** (`supabase.auth.signUp` and `supabase.auth.signInWithPassword`) — no custom password hashes are stored in application tables.
- The browser client (`src/lib/supabase.ts`) uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Supabase Auth stores the user's JWT session in browser `localStorage` and sends it automatically on every Postgres request so `auth.uid()` works inside RLS policies.
- `page.tsx` checks `supabase.auth.getSession()` on load and subscribes to `supabase.auth.onAuthStateChange(...)`, requiring `email_confirmed_at` before granting access.
- New signups verify their email with a 6–8 digit OTP code (`AuthForm.tsx`), while seeded demo accounts are pre-confirmed via `scripts/seed.ts` and shown with one-click fill buttons.

### B. Onboarding, 18+ Gate, DPDP Consent & Privacy Shield Setup (`Onboarding.tsx`)
When a newly signed-in user has no row in `profiles` (or clicks **Edit Profile / Shield**), `Onboarding.tsx` collects and upserts:
- **Illustration Avatar:** Picks from `/avatars/avatar-1.svg`–`avatar-6.svg`.
- **Basic Details & City:** `full_name`, `age`, `gender` (`M` / `F` / `Other`), `looking_for` (`M` / `F` / `All`), `city` (`Bengaluru`, `Hyderabad`, `Pune`, `NCR`, `Chennai`, `Mumbai`).
- **Simulated eLitmus & Career Fields:** `batch` (`2020`–`2024`), `role_title`, self-declared `company_domain` (lowercased), `college_name`, and `bio_prompt`.
- **Privacy Shield Toggles:**
  - `hide_same_company` (default `true`): hides profiles sharing the same `company_domain`.
  - `hide_same_college` (default `false`): hides profiles sharing the same `college_name`.
- **18+ Hard Age Gate:** Requires both checking the 18+ confirmation box and entering `age >= 18`, backed by Postgres `check (age >= 18)`.
- **DPDP Consent with Timestamp:** Requires checking the explicit purpose-limited consent checkbox; stores `dpdp_consent_at` as an ISO timestamp (`timestamptz not null`).

### C. 5-Question Compatibility Quiz (`Quiz.tsx`)
If `q1`–`q5` are `null` on `profiles` (or the user clicks **Retake Quiz**), `Quiz.tsx` renders 5 questions scored on a `1` to `5` scale (`check (qN between 1 and 5)`):
1. `q1` — **Work-Life Rhythm** (1 = Strict 9-to-6 boundaries, 5 = High-growth startup hustle)
2. `q2` — **Weekend Social Battery** (1 = Quiet reading, rest & home cooking, 5 = Outings, events & social plans)
3. `q3` — **Financial Style** (1 = Spend freely on experiences now, 5 = Disciplined saving & SIPs first)
4. `q4` — **Conflict Resolution** (1 = Take quiet space before talking, 5 = Discuss directly right away)
5. `q5` — **City & Future Flexibility** (1 = Stay settled in current city, 5 = Open to moving cities / abroad)

### D. Matching Engine, Privacy Shield & Daily 3/Day Cap (`src/lib/matching.ts`, `Matches.tsx`)
Whenever the user lands on `Matches`, `getOrCreateTodaysMatches(me)` runs on open (no scheduled cron jobs needed):
1. **Loads context:** Fetches `me`'s existing rows in `matches` (`user_a = me.id OR user_b = me.id`), `me`'s `reports_blocks` rows (`reporter_id = me.id`), and candidate rows from `profiles`.
2. **Enforces daily cap:** Separates existing non-blocked matches into `todaysRows` (`match_date === today`) and `earlierRows` (`match_date !== today`). Computes `dailyCap = me.is_plus_mock ? 4 : 3` and `slotsNeeded = Math.max(0, dailyCap - todaysRows.length)`.
3. **Filters candidates:**
   - Excludes `me.id`, anyone in `blockedIds`, and anyone already in `existingPartnerIds`.
   - Enforces mutual `looking_for` preference and same/nearby city (`NEARBY_CITIES` map, e.g., Bengaluru ↔ Hyderabad/Chennai; Pune ↔ Mumbai/Bengaluru; NCR ↔ Bengaluru/Pune).
   - **Privacy Shield:** Compares `company_domain` (case-insensitive) and `college_name` (case-insensitive). If hidden by `me`'s own shield toggles, removes the candidate and increments `hiddenByShieldCount` (`"N profiles hidden by your Privacy Shield"`). If hidden by the *candidate's* shield toggle only, removes them silently without leaking their existence.
4. **Compatibility Scoring:**
   - Computes `avgDiff = (|a.q1 - b.q1| + ... + |a.q5 - b.q5|) / 5` (ranging `0` to `4`).
   - Scales to 0–100: `Math.round(100 - (avgDiff / 4) * 100)`.
5. **Inserts top matches:** Sorts eligible candidates descending by score, inserts up to `slotsNeeded` rows into `matches` for `today`, and renders **Today's Curated Matches** (and any **Previous Active Matches** below).

### E. Chat, 4+ Word Rule, Progressive Photo Unblur & Report/Block (`src/lib/unblur.ts`, `Chat.tsx`)
1. **4+ Word Anti-Ghosting Rule:** `countWords(text)` splits on whitespace. Both `Chat.tsx` (on submit) and `unblur.ts` (when scoring messages) require **4 or more words** so one-word `"hi"` / `"hey"` messages are blocked and do not advance unblurring.
2. **Progressive Photo Unblur (`getUnblurStatus`):** Counts `validCount` (messages with `>= 4` words) and distinct senders (`bothHaveWritten = distinctSenders.size >= 2`):
   - **Level 1 (`blur-xl`):** Fewer than 2 distinct writers (0 or only 1 person has written valid messages).
   - **Level 2 (`blur-md`):** Both participants have written at least 1 valid message, and `validCount < 3` (e.g., 1 message from each person = 2 total).
   - **Level 3 (`blur-none`):** Both participants have written AND `validCount >= 3`.
3. **Live Sync:** `Chat.tsx` loads messages ordered by `created_at` and polls Supabase every 4 seconds (plus a manual **Refresh** button) so two accounts testing in separate windows see updates.
4. **Report & Block:** Clicking **Report / Block** lets the user select a reason and insert into `reports_blocks` (`reporter_id = currentUser.id`, `reported_id = partner.id`). `onBlocked()` immediately exits the chat and `Matches.tsx` filters out that match and excludes them from future matching.

### F. Mock Paywall (`PaywallModal.tsx`, `Matches.tsx`)
- When `!profile.is_plus_mock && todaysMatches.length >= 3`, `Matches.tsx` shows an **Unlock 4th Daily Match (Mock Paywall)** card labeled `"Mock paywall, no payment"`.
- Clicking **Simulate Plus Unlock (Free Demo)** sets `is_plus_mock = true` on `profiles` and triggers `Matches` to unlock the 4th daily slot (`4/4`) if an eligible candidate remains.

### G. Delete My Account & Legal/Safety Pages (`api/delete-account/route.ts`, `privacy`, `terms`, `grievance`)
- **Delete My Account:** Clicking **Delete My Account** → **Yes, Delete Permanently** sends `POST /api/delete-account` with `Authorization: Bearer <access_token>`. The server route uses `getSupabaseAdmin()` (`SUPABASE_SERVICE_ROLE_KEY`) to verify the JWT via `supabaseAdmin.auth.getUser(token)` and calls `supabaseAdmin.auth.admin.deleteUser(user.id)`. Postgres `ON DELETE CASCADE` deletes the user's `profiles`, `matches`, `messages`, and `reports_blocks` rows.
- **Legal & Grievance Pages:** Persistent footer in `layout.tsx` links to `/privacy`, `/terms`, and `/grievance` (displaying the prototype Grievance Officer contact `grievance@phavelength-prototype.example`), with no POSH claims and a clear disclaimer that this is a prototype requiring formal legal review before launch.

---

## 4. Database Schema & Row Level Security (`supabase/schema.sql`, `supabase/policies.sql`)

### Tables
- `profiles` (`id` FK → `auth.users(id) on delete cascade`, `age >= 18`, `batch between 2020 and 2024`, `q1..q5 between 1 and 5`, `dpdp_consent_at`, `is_plus_mock`, Privacy Shield booleans)
- `matches` (`id`, `user_a` FK, `user_b` FK, `compatibility_score`, `match_date default current_date`, `unique (user_a, user_b)`)
- `messages` (`id`, `match_id` FK, `sender_id` FK, `content`, `created_at`)
- `reports_blocks` (`id`, `reporter_id` FK, `reported_id` FK, `reason`, `created_at`)

### RLS Policies (Enabled on All 4 Tables)
- **`profiles`**: Any authenticated user can `SELECT`; only `auth.uid() = id` can `INSERT` or `UPDATE`.
- **`matches`**: Only participants (`auth.uid() in (user_a, user_b)`) can `SELECT` or `INSERT`.
- **`messages`**: Only participants of the parent match can `SELECT`; `INSERT` requires `sender_id = auth.uid()` AND being a participant of `match_id`.
- **`reports_blocks`**: Only `auth.uid() = reporter_id` can `SELECT` or `INSERT`.

---

## 5. Known Prototype Limitations (Stated Honestly)

1. **Optional `details` and profile column visibility:** Optional profile details (`profiles.details`, including interests, languages, open to, zodiac, education, communication style, love style, pets, drinking, smoking, and workout) are displayed as read-only chips to matched users and are visible to logged-in users under the `profiles` read policy.
2. **Stored `age` column can go stale:** The database retains the integer `age` column (`check (age >= 18)`), which is computed from `birth_date` whenever a user saves their profile. While the UI dynamically derives displayed age from `birth_date`, the stored `age` integer in Postgres is not automatically incremented on a user's birthday until their profile is next saved.
3. **Illustration avatars instead of photos (and CSS-only blur):** All profiles use local SVG illustration avatars (`/public/avatars/avatar-1.svg` through `avatar-6.svg`) instead of real user photo uploads. Photo blur (`blur-xl` / `blur-md` / `blur-none`) is applied visually in CSS while the SVG URL remains in the DOM; a production system with real photos would store pre-blurred assets and serve signed URLs on the server.
4. **Self-declared workplace, college, and batch:** Company domains, college names, role titles, and eLitmus batches are self-declared; no live eLitmus candidate database API or corporate email verification is integrated.
5. **Shareable meetup plan links:** Meetup plan links (`/plan/[token]`) are unguessable 128-bit tokens that expire 24 hours after the meetup time, but anyone who receives a forwarded link can view the four meetup summary fields until expiry or deletion.
6. **Mock paywall & no formal legal review:** The 4th daily match unlock is a mock toggle with no real payment processor, and the DPDP-inspired privacy/terms/grievance/safety pages have not undergone formal legal review.

---

## 6. Local Setup, Seeding & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a project at [supabase.com](https://supabase.com).
   - Run `supabase/schema.sql`, `supabase/policies.sql`, `supabase/migrations_features.sql`, `supabase/migrations_profile_settings.sql`, and `supabase/migrations_improvements.sql` in **SQL Editor**.

3. **Configure environment variables:**
   Copy `.env.example` to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-server-only
   ```
   *(`.env.local` is gitignored. Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code.)*

4. **Seed the 16 demo users (requires Node 22+):**
   ```bash
   node --experimental-strip-types --env-file=.env.local scripts/seed.ts
   ```

5. **Run locally or build:**
   ```bash
   npm run dev
   npm run build
   ```

---

## 7. Evaluator Demo Accounts

Shared password for all seeded accounts: `elitmus2026`

- **Demo 1 (Man, looking for women, Bengaluru, `flipkart.com`):** `aarav@elitmus-demo.in`
- **Demo 2 (Woman, looking for men, Bengaluru, `razorpay.com`):** `anya@elitmus-demo.in` *(shares a pre-seeded Level-2 match and 2 starter messages with Aarav)*
- **Beyond binary / Everyone filter test (Beyond binary, looking for everyone, Bengaluru):** `arjun@elitmus-demo.in`
- **Privacy Shield Test (Woman, Bengaluru, `flipkart.com`):** `divya@elitmus-demo.in` *(hidden from Aarav when Privacy Shield is ON)*
- **Additional seeded candidates:** `kriti@elitmus-demo.in`, `meera@elitmus-demo.in`, `priya@elitmus-demo.in`, `sneha@elitmus-demo.in`, `neha@elitmus-demo.in`, `tara@elitmus-demo.in`, `riya@elitmus-demo.in`, `rohan@elitmus-demo.in`, `vikram@elitmus-demo.in`, `dev@elitmus-demo.in`, `kabir@elitmus-demo.in`, `siddharth@elitmus-demo.in`

---

## 8. Disclosures

- **Libraries & services used:** Next.js, React, TypeScript, Tailwind CSS, `@supabase/supabase-js`, Supabase (Auth + PostgreSQL), Vercel.
- **Design & layout disclosure:** The two-column onboarding and edit-profile layout (with an `"Optional"` divider, pill/row option pickers, and a centered primary action button) is inspired by common dating-app onboarding patterns. All copy, color tokens (`Dusk`, `Fog`, `Ink`, `Teal`, `Marigold`), typography (`Bricolage Grotesque` and `Literata`), and SVG illustrations are original to pHavelength.
