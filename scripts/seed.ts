import { createClient } from "@supabase/supabase-js";

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "elitmus2026";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface SeedUser {
  email: string;
  full_name: string;
  age: number;
  gender: string;
  looking_for: string;
  city: string;
  role_title: string;
  company_domain: string;
  college_name: string;
  batch: number;
  hide_same_company: boolean;
  hide_same_college: boolean;
  bio_prompt: string;
  avatar_url: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
}

const SEED_USERS: SeedUser[] = [
  {
    email: "aarav@elitmus-demo.in",
    full_name: "Aarav Sharma",
    age: 25,
    gender: "M",
    looking_for: "F",
    city: "Bengaluru",
    role_title: "Backend Engineer",
    company_domain: "flipkart.com",
    college_name: "NIT Trichy",
    batch: 2022,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "2022 grad in BLR. Enjoy Sunday Cubbon Park runs, filter coffee walks, and honest conversations.",
    avatar_url: "/avatars/avatar-1.svg",
    q1: 4,
    q2: 3,
    q3: 4,
    q4: 5,
    q5: 4,
  },
  {
    email: "anya@elitmus-demo.in",
    full_name: "Anya Nair",
    age: 24,
    gender: "F",
    looking_for: "M",
    city: "Bengaluru",
    role_title: "Product Analyst",
    company_domain: "razorpay.com",
    college_name: "VIT Vellore",
    batch: 2023,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "2023 batch grad in Indiranagar. Big fan of indie theatre, bookstore hopping, and Coorg roadtrips.",
    avatar_url: "/avatars/avatar-2.svg",
    q1: 4,
    q2: 3,
    q3: 4,
    q4: 5,
    q5: 4,
  },
  {
    email: "divya@elitmus-demo.in",
    full_name: "Divya Menon",
    age: 25,
    gender: "F",
    looking_for: "M",
    city: "Bengaluru",
    role_title: "SDE-2 (Same Company Test)",
    company_domain: "flipkart.com",
    college_name: "NIT Calicut",
    batch: 2022,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "Works at flipkart.com! Hidden from Aarav when Privacy Shield is ON.",
    avatar_url: "/avatars/avatar-6.svg",
    q1: 4,
    q2: 3,
    q3: 4,
    q4: 5,
    q5: 4,
  },
  {
    email: "kriti@elitmus-demo.in",
    full_name: "Kriti Deshmukh",
    age: 26,
    gender: "F",
    looking_for: "M",
    city: "Bengaluru",
    role_title: "Full-Stack Developer",
    company_domain: "zerodha.com",
    college_name: "COEP Pune",
    batch: 2021,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "Calm energy, zero drama. Love weekend bouldering, cooking comfort food, and morning cycling.",
    avatar_url: "/avatars/avatar-3.svg",
    q1: 4,
    q2: 2,
    q3: 5,
    q4: 5,
    q5: 3,
  },
  {
    email: "meera@elitmus-demo.in",
    full_name: "Meera Krishnan",
    age: 25,
    gender: "F",
    looking_for: "M",
    city: "Bengaluru",
    role_title: "UX Researcher",
    company_domain: "cred.club",
    college_name: "SRM Chennai",
    batch: 2022,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "Curious about people and design. Looking for emotional maturity and good coffee conversations.",
    avatar_url: "/avatars/avatar-4.svg",
    q1: 3,
    q2: 4,
    q3: 3,
    q4: 4,
    q5: 4,
  },
  {
    email: "priya@elitmus-demo.in",
    full_name: "Priya Iyer",
    age: 24,
    gender: "F",
    looking_for: "M",
    city: "Bengaluru",
    role_title: "Data Engineer",
    company_domain: "swiggy.in",
    college_name: "PSG Tech",
    batch: 2023,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "Board game enthusiast and always up for discovering hidden filter coffee spots across Bangalore.",
    avatar_url: "/avatars/avatar-5.svg",
    q1: 3,
    q2: 5,
    q3: 3,
    q4: 3,
    q5: 2,
  },
  {
    email: "sneha@elitmus-demo.in",
    full_name: "Sneha Reddy",
    age: 25,
    gender: "F",
    looking_for: "M",
    city: "Hyderabad",
    role_title: "Platform Engineer",
    company_domain: "atlassian.com",
    college_name: "IIIT Hyderabad",
    batch: 2022,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "Weekend hiker and sci-fi reader based in Hyderabad. Open to exploring Bengaluru.",
    avatar_url: "/avatars/avatar-2.svg",
    q1: 5,
    q2: 4,
    q3: 2,
    q4: 4,
    q5: 5,
  },
  {
    email: "neha@elitmus-demo.in",
    full_name: "Neha Kulkarni",
    age: 24,
    gender: "F",
    looking_for: "M",
    city: "Bengaluru",
    role_title: "Frontend Engineer",
    company_domain: "groww.in",
    college_name: "RVCE Bengaluru",
    batch: 2023,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "Into filter coffee walks, indie playlists, and weekend badminton doubles in HSR.",
    avatar_url: "/avatars/avatar-4.svg",
    q1: 4,
    q2: 3,
    q3: 5,
    q4: 4,
    q5: 4,
  },
  {
    email: "rohan@elitmus-demo.in",
    full_name: "Rohan Verma",
    age: 26,
    gender: "M",
    looking_for: "F",
    city: "Bengaluru",
    role_title: "Data Scientist",
    company_domain: "swiggy.in",
    college_name: "PEC Chandigarh",
    batch: 2021,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "Amateur chef who makes Thai green curry, plays Tuesday badminton, and values consistency.",
    avatar_url: "/avatars/avatar-5.svg",
    q1: 4,
    q2: 3,
    q3: 4,
    q4: 4,
    q5: 4,
  },
  {
    email: "vikram@elitmus-demo.in",
    full_name: "Vikram Joshi",
    age: 25,
    gender: "M",
    looking_for: "F",
    city: "Bengaluru",
    role_title: "Product Engineer",
    company_domain: "postman.com",
    college_name: "RVCE Bengaluru",
    batch: 2022,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "Enjoys acoustic guitar, quiet cafes in Indiranagar, and meaningful 1-on-1 conversations.",
    avatar_url: "/avatars/avatar-3.svg",
    q1: 3,
    q2: 2,
    q3: 4,
    q4: 5,
    q5: 3,
  },
];

async function runSeed() {
  const supabaseAdmin = createAdminClient();
  const now = new Date().toISOString();
  const idByEmail: Record<string, string> = {};

  // Fetch existing auth users so the script can be re-run safely
  const { data: existingList, error: listError } =
    await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  if (listError) throw listError;

  const existingByEmail = new Map(
    existingList.users.map((u) => [u.email?.toLowerCase() ?? "", u.id])
  );

  for (const user of SEED_USERS) {
    let userId = existingByEmail.get(user.email.toLowerCase());

    if (!userId) {
      const { data: created, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
        });
      if (createErr) throw createErr;
      userId = created.user.id;
      console.log(`Created auth user: ${user.email}`);
    } else {
      console.log(`Auth user already exists: ${user.email}`);
    }

    idByEmail[user.email] = userId;

    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: user.full_name,
      age: user.age,
      gender: user.gender,
      looking_for: user.looking_for,
      city: user.city,
      role_title: user.role_title,
      company_domain: user.company_domain,
      college_name: user.college_name,
      batch: user.batch,
      hide_same_company: user.hide_same_company,
      hide_same_college: user.hide_same_college,
      bio_prompt: user.bio_prompt,
      avatar_url: user.avatar_url,
      q1: user.q1,
      q2: user.q2,
      q3: user.q3,
      q4: user.q4,
      q5: user.q5,
      dpdp_consent_at: now,
      is_plus_mock: false,
    });

    if (profileErr) throw profileErr;
  }

  // Seed one shared match between the two evaluator accounts (Aarav & Anya)
  // with 2 messages so evaluators can immediately test both sides of the chat + unblur flow.
  const aaravId = idByEmail["aarav@elitmus-demo.in"];
  const anyaId = idByEmail["anya@elitmus-demo.in"];

  if (aaravId && anyaId) {
    const { data: existingMatch } = await supabaseAdmin
      .from("matches")
      .select("id")
      .or(
        `and(user_a.eq.${aaravId},user_b.eq.${anyaId}),and(user_a.eq.${anyaId},user_b.eq.${aaravId})`
      )
      .maybeSingle();

    let matchId = existingMatch?.id;
    if (!matchId) {
      const { data: insertedMatch, error: matchErr } = await supabaseAdmin
        .from("matches")
        .insert({
          user_a: aaravId,
          user_b: anyaId,
          compatibility_score: 100,
        })
        .select("id")
        .single();
      if (matchErr) throw matchErr;
      matchId = insertedMatch.id;

      await supabaseAdmin.from("messages").insert([
        {
          match_id: matchId,
          sender_id: anyaId,
          content:
            "Hey Aarav! Loved your prompt about Sunday Cubbon Park runs and filter coffee.",
        },
        {
          match_id: matchId,
          sender_id: aaravId,
          content:
            "Thanks Anya! One more thoughtful message from either of us will unblur our photos.",
        },
      ]);
      console.log("Seeded shared match & starter messages between Aarav and Anya.");
    }
  }

  console.log("Seed complete!");
}

runSeed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
