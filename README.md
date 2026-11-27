# Maithri 

An intentional dating web application built for the **eLitmus Software Developer assignment ("Start up founder of a Dating App")**, designed for early-career Indian graduates (2020–2023 batches, ages ~22–28) in tech-hub cities.

---

## 1. Product Thesis & Honest Prototype Framing

### Problems Targeted
1. **Swipe fatigue & choice overload** → No swipe deck. Users receive up to **5, 7, or 10 curated daily picks** depending on their plan.
2. **Low-effort `"hey"` openers & superficial photo judgment** → **4+ word minimum** per message and **progressive photo unblur** (`blur-xl` → `blur-md` → `blur-none`) unlocked only through mutual conversation.
3. **Workplace & alumni awkwardness** → **Privacy Shield** that hides candidates sharing the same self-declared `company_domain` or `college_name` and displays `"N profiles hidden by your Privacy Shield"`.
4. **Trust, privacy & safety concerns** → **18+ hard age gate**, **DPDP Act 2023 style explicit consent with stored timestamp**, **Report & Block**, **Delete My Account**, and plain-language **Privacy**, **Terms**, and **Grievance Contact** pages.

### Simulated vs. Real (Honest Disclosures)
- **Simulated eLitmus verification:** This prototype does **not** connect to eLitmus's private candidate database. Batch/verification badges are simulated and explicitly labeled `"Simulated eLitmus verification (prototype)"` in the UI, designed to plug into eLitmus data later. Company domains are self-declared.
- **Sandbox-only payments:** The `/upgrade` page offers **Free** (₹0/month), **Plus** (₹199/month), and **Pro** (₹349/month) tiers powered by **Cashfree Sandbox** (`"Test mode: no real money is charged."`). Payment routes refuse to run unless `CASHFREE_ENV=sandbox` and `CASHFREE_APP_ID` starts with `TEST`.
- **Profile media:** Members can choose an illustrated avatar or upload a photo. Uploaded photos have separate blur variants, and match responses serve the variant for the conversation’s current reveal level. Voice intros are optional.

---

## 2. Tech Stack & Project Structure

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Backend / Auth / Database:** Supabase (Supabase Auth + PostgreSQL with Row Level Security + Realtime)
- **Voice & Video Calling:** LiveKit Cloud (`livekit-server-sdk`, `livekit-client`, `@livekit/components-react`)
- **Hosting:** Vercel

```text
public/
  avatars/
    avatar-1.svg ... avatar-6.svg   # Illustration placeholder avatars
scripts/
  seed.ts                           # Seeds 100 pool profiles and the featured evaluator accounts
supabase/
  schema.sql                        # 4 PostgreSQL tables + constraints + cascades
  policies.sql                      # Row Level Security (RLS) rules for all 4 tables
src/
  lib/
    supabase.ts                     # Browser Supabase client (anon key) + Profile type
    supabaseAdmin.ts                # Server-only Supabase client (service-role key)
    matching.ts                     # Candidate filtering, scoring, and daily picks
    unblur.ts                       # 4+ word message validation + blur levels 1–3
  components/
    AuthForm.tsx                    # Member and founder sign-in, signup, and email verification
    PasswordInput.tsx               # Password field with an accessible visibility toggle
    IncomingCalls.tsx               # App-wide incoming calls and session presence
    ModerationNotice.tsx            # Account notices for warnings, suspensions, and restorations
    Onboarding.tsx                  # Avatar picker, profile fields, Privacy Shield, 18+ gate, DPDP consent
    Quiz.tsx                        # 5-question compatibility quiz (1–5 scale)
    Matches.tsx                     # Daily curated matches, Privacy Shield counter, Upgrade link
    Chat.tsx                        # Live chat, 4+ word enforcement, unblur bar, Report & Block, call actions
    CallPanel.tsx                   # LiveKit voice/video call UI, ringing flow, Realtime sync
    UpgradeCallDialog.tsx           # Accessible dialog prompting Plus/Pro upgrade on locked call actions
  app/
    layout.tsx                      # Root layout + persistent footer (Grievance, Privacy, Terms)
    page.tsx                        # Main state router (Auth -> Onboarding -> Quiz -> Matches <-> Chat + Delete Account)
    admin/page.tsx                  # Founder moderation queue, decisions, and audit history
    reset-password/page.tsx         # Request recovery email and set a new password
    upgrade/page.tsx                # Free, Plus, and Pro plans with Cashfree Sandbox checkout
    api/moderation/                 # Founder-only report decisions and account status
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
- The homepage observes Supabase Auth session changes and requires a verified email. After sign-in, a server-side check sends the configured founder to `/admin`. Members continue to onboarding or Matches. The admin dashboard has its own sign-in entry and **Sign out** button.
- New signups verify their email with a 6–8 digit OTP code (`AuthForm.tsx`), while seeded demo accounts are pre-confirmed via `scripts/seed.ts` and shown with one-click fill buttons.

- **Forgot password?** opens `/reset-password` from either sign-in form. The recovery email returns the user to Maithri to set and confirm a new password. Sign-in, signup, and reset password fields have show/hide controls.

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

### D. Matching Engine, Privacy Shield & Daily Picks

`POST /api/matches` loads the account’s effective plan and allocates picks when the user opens or refreshes Matches. Daily picks reset at midnight in Asia/Kolkata. The active daily batch can refill after matches are passed, blocked, or closed, subject to eligible candidates. Earlier matches and conversations remain accessible when allowed by the match state.

The server filters for mutual preferences, location, relationship goals, bidirectional blocks, suspended accounts, and Privacy Shield settings. The compatibility score is based on differences across the five quiz answers, with a penalty for a one-step relationship-goal difference. Match reasons are returned for Plus and Pro. Free users see a locked preview.

### E. Chat, 4+ Word Rule, Progressive Photo Unblur & Report/Block (`src/lib/unblur.ts`, `Chat.tsx`)
1. **4+ Word Anti-Ghosting Rule:** `countWords(text)` splits on whitespace. Both `Chat.tsx` (on submit) and `unblur.ts` (when scoring messages) require **4 or more words** so one-word `"hi"` / `"hey"` messages are blocked and do not advance unblurring.
2. **Progressive Photo Unblur (`getUnblurStatus`):** Counts `validCount` (messages with `>= 4` words) and distinct senders (`bothHaveWritten = distinctSenders.size >= 2`):
   - **Level 1 (`blur-xl`):** Fewer than 2 distinct writers (0 or only 1 person has written valid messages).
   - **Level 2 (`blur-md`):** Both participants have written at least 1 valid message, and `validCount < 3` (e.g., 1 message from each person = 2 total).
   - **Level 3 (`blur-none`):** Both participants have written AND `validCount >= 3`.
3. **Live Sync & Read Receipts:** `Chat.tsx` subscribes to Supabase Realtime (`postgres_changes`) for instant messages, read receipts (`Sent` / `Seen`), and live unmatch closure, with a 15s fallback poll and a manual **Refresh messages** button.
4. **Unified Pass & Unmatch (`Matches.tsx`, `Chat.tsx`, `/api/match-action`):**
   - **Pass (zero messages only):** Available on match cards and in chat when no messages exist. Quietly removes the match for both people (with a 6-second `"Passed. Undo"` toast on cards) and prevents future re-matching. If a message arrives before Pass completes, the API returns `409` and prompts the user to open chat to unmatch.
   - **Unmatch (once messages exist):** Available only inside Chat once at least one message exists. Requires choosing one of four fixed polite closure messages, hides the match for the user who unmatched, and notifies the other person (`"Unmatched"`, `"This match has ended."`, read-only chat history, and a `"Remove from my list"` button).
5. **Report & Block:** Clicking **Report and block** lets the user select a reason and calls `POST /api/block` to insert into `reports_blocks` (`reporter_id = currentUser.id`, `reported_id = partner.id`) and immediately end any active call. `onBlocked()` immediately exits the chat and RLS + `/api/matches` prevent either user from reading/sending messages or matching again.
6. **Voice & Video Calling (`CallPanel.tsx`, `src/lib/livekitServer.ts`, `/api/calls/*`):**
   - **Gating:** Voice calls unlock at **Level 2**; video calls unlock at **Level 3** (enforced on the server in `/api/calls/start`). Blocked, unmatched, or passed pairs cannot start or accept calls, and unmatching/blocking ends any active call and deletes its room.
   - **Room & Token Rules:** Rooms are created with random unguessable names, capped at 2 participants, with no recording/egress. Short-lived tokens (45 minutes) bind `identity` to the user's ID, `name` to first name only, and restrict voice calls to microphone-only publishing via `canPublishSources`.
   - **Incoming calls:** Both members need an open Maithri session. The recipient can accept or decline from any signed-in screen. Closing the last tab ends a pending ring when the browser reports the close. A connection that disappears without a close signal expires after roughly 35 seconds, plus the next check.
   - **Call history:** Chats show up to 100 recent finished call records alongside messages, including missed, declined, cancelled, and ended calls.
   - **Rate Limit:** Maximum **10 call starts per user per hour** and **1 active/ringing call per match**.
   - **Graceful Fallback:** If `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, or `NEXT_PUBLIC_LIVEKIT_URL` is missing, Call buttons are hidden cleanly without errors.

### F. Plans & Sandbox Upgrades (`src/lib/entitlements.ts`, `src/lib/plans.ts`, `/upgrade`, `Matches.tsx`)
- **Three Tiers (`profiles.plan`):**
  - **Free (₹0/month):** Curated daily matches (5/day) and text messaging (4+ words).
  - **Plus (₹199/month):** 7 curated daily matches/day, text messaging, **voice calls** (unlocked at unblur Level 2+), and **match reasons**.
  - **Pro (₹349/month):** 10 curated daily matches/day, text messaging, **voice calls** (Level 2+), **video calls** (unlocked at unblur Level 3), and **match reasons**.
- **Match Reasons Gating:** Plus and Pro: match reasons are available; Free sees them blurred; the server (`/api/matches`) omits the real reasons data for Free (`reasons: null`, `reasons_locked: true`).
- **Caller-Pays Rule for Calls:** The caller's plan decides whether a voice or video call can start (`/api/calls/start` checks plan first, then unblur level). The receiver can accept an incoming call on **any** plan (`/api/calls/accept`).
- **Cashfree Sandbox Payment Flow (`/upgrade`, `/upgrade/result`, `/api/payments/*`):**
  - Clicking **Choose Plus** or **Choose Pro** calls `POST /api/payments/create-order` (server computes INR amount from `src/lib/plans.ts`, enforces the `CASHFREE_ENV=sandbox` + `TEST_` App ID guard, rate-limits to 10 orders/hour, and inserts a `'created'` row in `payments`).
  - Cashfree's JS SDK v3 (`mode: "sandbox"`) opens modal checkout and redirects to `/upgrade/result?order_id=...`, which calls `POST /api/payments/verify` (server fetches status from Cashfree, checks `PAID` + amount + `INR`, atomically marks `payments` `'paid'`, and grants **30-day access** via `profiles.plan_expires_at` with no recurring billing; renewing the same plan extends from the current expiry if later than now).
  - `POST /api/payments/webhook` verifies Cashfree's raw-body `x-webhook-signature` + `x-webhook-timestamp` HMAC-SHA256 and runs the same idempotent verification helper.
  - **Demo accounts:** Seeded Plus (`rohan@elitmus-demo.in`) and Pro (`vikram@elitmus-demo.in`) accounts have `plan_expires_at = null` so evaluators never lose access.
  - **Sandbox test data:** Visa `4706131211212123` (Expiry `03/2028`, CVV `123`, Name `Test`, OTP `111000`); UPI `testsuccess@gocash` (success) or `invalid@upi` (failure).

### G. Profile Settings, Safety & Account Deletion

Profile settings support editing personal details and preferences, updating photo and voice intro media, and retaking the quiz. Maithri also includes House Rules, a Safety page, and light, dark, and system theme settings. From an eligible chat, members can create a shareable meetup plan for a trusted contact.

### H. Delete My Account & Legal/Safety Pages (`api/delete-account/route.ts`, `privacy`, `terms`, `grievance`)
- **Delete My Account:** Clicking **Delete My Account** → **Yes, Delete Permanently** sends `POST /api/delete-account` with `Authorization: Bearer <access_token>`. The server route uses `getSupabaseAdmin()` (`SUPABASE_SERVICE_ROLE_KEY`) to verify the JWT via `supabaseAdmin.auth.getUser(token)` and calls `supabaseAdmin.auth.admin.deleteUser(user.id)`. Postgres `ON DELETE CASCADE` deletes the user's `profiles`, `matches`, `messages`, and `reports_blocks` rows.
- **Legal & Grievance Pages:** Persistent footer in `layout.tsx` links to `/privacy`, `/terms`, and `/grievance` (displaying the prototype Grievance Officer contact `grievance@phavelength-prototype.example`), with no POSH claims and a clear disclaimer that this is a prototype requiring formal legal review before launch.

---

## 4. Database, Access Rules & Founder Moderation

- `schema.sql` and `policies.sql` create the base tables. The migrations add the current profile settings, daily picks, call records and presence, payments, and moderation.
- Members can read their own profile. The matches API serves match-safe profile data. Message and call reads depend on match membership, blocks, and suspension. Message sends also require an open match.
- **Report and block** creates a report in the founder’s queue. The dashboard groups reports into **Open**, **In review**, and **Resolved**. Decisions include **Dismiss**, **Warn**, **Suspend**, and **Restore access**, with a private reason, actor, and timestamp in the audit history. Warnings, suspensions, and restorations include a separate notice for the account holder.
- Suspending an account restricts discovery, messaging, and calling. Dismissing a report leaves the reporter’s block in effect.

---

## 5. Known Prototype Limitations (Stated Honestly)

1. **Stored `age` column can go stale:** The database retains the integer `age` column (`check (age >= 18)`), which is computed from `birth_date` whenever a user saves their profile. While the UI dynamically derives displayed age from `birth_date`, the stored `age` integer in Postgres is not automatically incremented on a user's birthday until their profile is next saved.
2. **Self-declared workplace, college, and batch:** Company domains, college names, role titles, and eLitmus batches are self-declared; no live eLitmus candidate database API or corporate email verification is integrated.
3. **Shareable meetup plan links:** Meetup plan links (`/plan/[token]`) are random 160-bit tokens that expire 24 hours after the meetup time, but anyone who receives a forwarded link can view the four meetup summary fields until expiry or deletion.
4. **Sandbox payments & production gaps:** Payments run in Cashfree Sandbox mode only (no real money is charged, no recurring billing, and no refunds or cancellations flow). Plan data lives in `profiles.plan` and `profiles.plan_expires_at` and is protected by `trg_enforce_profile_plan_guard`. A production launch would require Cashfree production activation, collecting a real customer phone number if Cashfree enforces it, GST handling, a refund policy, and formal legal review of the DPDP-inspired privacy/terms/grievance/safety pages.
5. **Unified Pass & Unmatch limits:** Closure messages on Unmatch are a fixed set of four polite options (no free text), and a silent **Pass** on a zero-message match can still be noticed by the other person if they already viewed their list before refreshing.
6. **Voice & Video Calling (LiveKit Cloud):**
   - Free-plan limits apply; see [LiveKit Pricing](https://livekit.io/pricing) for current quotas and limits.
   - Audio-only enforcement on voice calls depends on LiveKit token `canPublishSources` permissions (`TrackSource.MICROPHONE`).
   - Calls may fail on restrictive corporate/campus firewalls or symmetric NAT networks that block WebRTC UDP/ICE traffic.

---

## 6. Local Setup, Seeding & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a project at [supabase.com](https://supabase.com).
   - Run `supabase/schema.sql`, `supabase/policies.sql`, `supabase/migrations_features.sql`, `supabase/migrations_profile_settings.sql`, `supabase/migrations_improvements.sql`, `supabase/migrations_pass_unmatch.sql`, `supabase/migrations_calls.sql`, `supabase/migrations_calls_realtime.sql`, `supabase/migrations_plans.sql`, `supabase/migrations_payments.sql`, `supabase/migrations_review_fixes.sql`, `supabase/migrations_daily_picks.sql`, `supabase/migrations_call_presence.sql`, and `supabase/migrations_moderation.sql` in **SQL Editor**, in that order.

3. **Configure environment variables:**
   Copy `.env.example` to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-server-only
   NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your-livekit-api-key-server-only
   LIVEKIT_API_SECRET=your-livekit-api-secret-server-only
   CASHFREE_APP_ID=TEST_your-sandbox-app-id
   CASHFREE_SECRET_KEY=your-sandbox-secret-key-server-only
   CASHFREE_ENV=sandbox
   NEXT_PUBLIC_CASHFREE_MODE=sandbox
   MAITHRI_FOUNDER_USER_ID=your-verified-founder-auth-user-uuid
   ```
   *(`.env.local` is gitignored. Never expose `SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, or `CASHFREE_SECRET_KEY` in client code.)*

4. **Seed the featured accounts and demo pool (requires Node 22+):**
   ```bash
   node --experimental-strip-types --env-file=.env.local scripts/seed.ts
   ```

   To refresh only the 50 male and 50 female pool profiles, leaving the featured evaluator accounts and starter chats alone, append `--pool-only`.

5. **Run locally or build:**
   ```bash
   npm run dev
   npm run build
   ```

---

## 7. Evaluator Demo Accounts

Shared password for all seeded accounts: `elitmus2026`

- **Demo 1 (Free plan — Man, looking for women, Bengaluru, `flipkart.com`):** `aarav@elitmus-demo.in` *(Level-2 match with Anya; Level-3 match with Priya)*
- **Demo 2 (Free plan — Woman, looking for men, Bengaluru, `razorpay.com`):** `anya@elitmus-demo.in` *(shares a pre-seeded Level-2 match and 2 starter messages with Aarav)*
- **Demo 3 (Plus plan — Man, looking for women, Bengaluru, `swiggy.in`):** `rohan@elitmus-demo.in` *(Level-3 match with `kriti@elitmus-demo.in` for voice-call testing; seeded with `plan_expires_at = null` so it never expires)*
- **Demo 4 (Pro plan — Man, looking for everyone, Bengaluru, `postman.com`):** `vikram@elitmus-demo.in` *(Level-3 match with `sneha@elitmus-demo.in` for voice & video-call testing; seeded with `plan_expires_at = null` so it never expires)*
- **Beyond binary / Everyone filter test (Beyond binary, looking for everyone, Bengaluru):** `arjun@elitmus-demo.in`
- **Privacy Shield Test (Woman, Bengaluru, `flipkart.com`):** `divya@elitmus-demo.in` *(hidden from Aarav when Privacy Shield is ON)*
- **Additional seeded candidates:** `kriti@elitmus-demo.in`, `meera@elitmus-demo.in`, `priya@elitmus-demo.in`, `sneha@elitmus-demo.in`, `neha@elitmus-demo.in`, `tara@elitmus-demo.in`, `riya@elitmus-demo.in`, `dev@elitmus-demo.in`, `kabir@elitmus-demo.in`, `siddharth@elitmus-demo.in`

---

## 8. Disclosures

- **Libraries & services used:** Next.js, React, TypeScript, Tailwind CSS, `@supabase/supabase-js`, Supabase (Auth + PostgreSQL + Realtime), LiveKit Cloud (`livekit-server-sdk`, `livekit-client`, `@livekit/components-react`), Vercel.
- **Third-party calling disclosure:** 1-on-1 voice and video calls are routed through **LiveKit Cloud (EU region)**. Maithri does not record or store call audio/video content; only call metadata (`calls` table) is persisted.
- **Design & layout disclosure:** The two-column onboarding and edit-profile layout (with an `"Optional"` divider, pill/row option pickers, and a centered primary action button) is inspired by common dating-app onboarding patterns. All copy, color tokens (`Dusk`, `Fog`, `Ink`, `Teal`, `Marigold`), typography (`Bricolage Grotesque` and `Literata`), and SVG illustrations are original to Maithri.

## 9. Deployment & Verification

### Founder moderation

Apply `supabase/migrations_moderation.sql` after the other migrations. Set the server-only `MAITHRI_FOUNDER_USER_ID` environment variable to your verified founder account UUID from Supabase Authentication. Use `.env.local` for local development or set the variable in the Vercel project’s **Production** environment and redeploy. Sign in with the verified founder account to open `/admin` automatically.

To verify moderation, submit a report between test accounts, review it as founder, and confirm the decision appears in the audit history and any account notice appears for the reported test account.

### Password reset

In Supabase Authentication URL Configuration, add the full reset URL for each Maithri origin. For local development use `http://localhost:3000/reset-password`. For production use `https://maithri-app.vercel.app/reset-password` or the equivalent path on your production domain. The recovery email template must link to Supabase's confirmation URL so opening the link starts a recovery session.

### Local checks

Run `npm test` for matching and photo reveal tests, and `npx tsc --noEmit` for type checking. The current project does not install ESLint, so `npm run lint` requires additional setup.
