create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  age int not null check (age >= 18),
  gender text not null,
  looking_for text not null,
  city text not null,
  role_title text,
  company_domain text,            -- self-declared (prototype)
  college_name text,
  batch int check (batch between 2020 and 2024),
  hide_same_company boolean default true,
  hide_same_college boolean default false,
  bio_prompt text,
  avatar_url text,                -- illustration / AI placeholder, not real people
  q1 int check (q1 between 1 and 5),
  q2 int check (q2 between 1 and 5),
  q3 int check (q3 between 1 and 5),
  q4 int check (q4 between 1 and 5),
  q5 int check (q5 between 1 and 5),
  dpdp_consent_at timestamptz not null,
  is_plus_mock boolean default false,
  created_at timestamptz default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  compatibility_score int not null,
  match_date date not null default current_date,
  created_at timestamptz default now(),
  unique (user_a, user_b)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table reports_blocks (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_id uuid not null references profiles(id) on delete cascade,
  reason text,
  created_at timestamptz default now()
);
