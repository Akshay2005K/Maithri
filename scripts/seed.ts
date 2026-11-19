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
  relationship_goal: "casual" | "open" | "long_term" | "marriage";
  prompts: { key: string; answer: string }[];
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
    relationship_goal: "long_term",
    prompts: [
      {
        key: "A perfect Sunday",
        answer: "Early Cubbon Park run, masala dosa at Airlines, and an hour reading in Indiranagar.",
      },
      {
        key: "Something I'm learning",
        answer: "How to brew clean V60 pour-over coffee without over-extracting it.",
      },
    ],
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
    relationship_goal: "long_term",
    prompts: [
      {
        key: "A perfect Sunday",
        answer: "Browsing Champaca bookstore slowly, then sharing hot ramen on 12th Main.",
      },
      {
        key: "My ideal first date",
        answer: "A 45-minute filter coffee walk in a quiet neighbourhood before deciding on dinner.",
      },
    ],
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
    relationship_goal: "long_term",
    prompts: [
      {
        key: "A city habit I love",
        answer: "Evening filter coffee stops in Jayanagar right after the rain clears.",
      },
      {
        key: "I'm happiest when",
        answer: "Playing two hours of doubles badminton without checking Slack once.",
      },
    ],
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
    relationship_goal: "open",
    prompts: [
      {
        key: "I'm happiest when",
        answer: "Cooking Maharashtrian comfort food on Sunday afternoon with zero rush.",
      },
      {
        key: "A small thing I care about",
        answer: "People who communicate directly instead of leaving vague hints.",
      },
    ],
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
    relationship_goal: "long_term",
    prompts: [
      {
        key: "My ideal first date",
        answer: "Trying a pottery workshop or sketching over masala chai in Indiranagar.",
      },
      {
        key: "Something I'm learning",
        answer: "Listening better without immediately trying to fix the other person's problem.",
      },
    ],
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
    relationship_goal: "casual",
    prompts: [
      {
        key: "A city habit I love",
        answer: "Saturday evening board games at a neighbourhood cafe with friends.",
      },
      {
        key: "A perfect Sunday",
        answer: "Late breakfast at a south Bengaluru darshini and practicing Carnatic violin.",
      },
    ],
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
    relationship_goal: "marriage",
    prompts: [
      {
        key: "I'm happiest when",
        answer: "Finishing a 6 AM trail climb before the city wakes up.",
      },
      {
        key: "A small thing I care about",
        answer: "Honesty about long-term plans early on so nobody wastes each other's time.",
      },
    ],
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
    relationship_goal: "long_term",
    prompts: [
      {
        key: "A perfect Sunday",
        answer: "Morning badminton in HSR followed by cold brew and a quiet afternoon playlist.",
      },
      {
        key: "My ideal first date",
        answer: "Walking through Lalbagh early in the morning and grabbing breakfast nearby.",
      },
    ],
    q1: 4,
    q2: 3,
    q3: 5,
    q4: 4,
    q5: 4,
  },
  {
    email: "tara@elitmus-demo.in",
    full_name: "Tara Nair",
    age: 24,
    gender: "F",
    looking_for: "M",
    city: "Bengaluru",
    role_title: "Product Designer",
    company_domain: "zomato.com",
    college_name: "NID Ahmedabad",
    batch: 2023,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "Sketching in cafes, discovering live acoustic gigs, and open to meaningful connections.",
    avatar_url: "/avatars/avatar-2.svg",
    relationship_goal: "open",
    prompts: [
      {
        key: "A perfect Sunday",
        answer: "Slow brunch in Koramangala followed by sketching in Cubbon Park.",
      },
      {
        key: "My ideal first date",
        answer: "Visiting a gallery or indie film screening and talking over chai.",
      },
    ],
    q1: 3,
    q2: 4,
    q3: 3,
    q4: 4,
    q5: 4,
  },
  {
    email: "riya@elitmus-demo.in",
    full_name: "Riya Kapoor",
    age: 23,
    gender: "F",
    looking_for: "M",
    city: "Bengaluru",
    role_title: "Growth Analyst",
    company_domain: "meesho.com",
    college_name: "NSUT Delhi",
    batch: 2023,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "New to Bengaluru, looking to meet fun people for coffee, comedy nights, and weekend drives.",
    avatar_url: "/avatars/avatar-6.svg",
    relationship_goal: "casual",
    prompts: [
      {
        key: "A city habit I love",
        answer: "Trying a different neighbourhood coffee roaster every Saturday morning.",
      },
      {
        key: "I'm happiest when",
        answer: "Laughing at a good stand-up show with friends after a busy week.",
      },
    ],
    q1: 4,
    q2: 5,
    q3: 2,
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
    relationship_goal: "long_term",
    prompts: [
      {
        key: "Something I'm learning",
        answer: "Making homemade Thai curry pastes from scratch on weekends.",
      },
      {
        key: "A small thing I care about",
        answer: "Keeping phones face down during dinner conversations.",
      },
    ],
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
    relationship_goal: "open",
    prompts: [
      {
        key: "A city habit I love",
        answer: "Finding quiet shaded streets in Indiranagar to walk after 7 PM.",
      },
      {
        key: "I'm happiest when",
        answer: "Fingerpicking acoustic guitar songs while it rains outside.",
      },
    ],
    q1: 3,
    q2: 2,
    q3: 4,
    q4: 5,
    q5: 3,
  },
  {
    email: "dev@elitmus-demo.in",
    full_name: "Dev Malhotra",
    age: 26,
    gender: "M",
    looking_for: "F",
    city: "Bengaluru",
    role_title: "Systems Engineer",
    company_domain: "phonepe.com",
    college_name: "BITS Pilani",
    batch: 2021,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "Long-distance runner, amateur baker, and looking for a grounded partner in Bengaluru.",
    avatar_url: "/avatars/avatar-1.svg",
    relationship_goal: "long_term",
    prompts: [
      {
        key: "Something I'm learning",
        answer: "Baking sourdough bread without turning my kitchen into a flour cloud.",
      },
      {
        key: "A small thing I care about",
        answer: "Showing up on time and following through on plans we make.",
      },
    ],
    q1: 4,
    q2: 3,
    q3: 4,
    q4: 5,
    q5: 4,
  },
  {
    email: "arjun@elitmus-demo.in",
    full_name: "Arjun Rao",
    age: 24,
    gender: "M",
    looking_for: "F",
    city: "Bengaluru",
    role_title: "ML Engineer",
    company_domain: "ola.electric",
    college_name: "IIIT Bangalore",
    batch: 2023,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "Curious about transit, street photography, and unhurried conversations over filter coffee.",
    avatar_url: "/avatars/avatar-4.svg",
    relationship_goal: "open",
    prompts: [
      {
        key: "A city habit I love",
        answer: "Taking metro rides to old Bengaluru neighbourhoods with a camera.",
      },
      {
        key: "My ideal first date",
        answer: "Bookstore browsing followed by masala dosa at a classic darshini.",
      },
    ],
    q1: 3,
    q2: 3,
    q3: 4,
    q4: 4,
    q5: 4,
  },
  {
    email: "kabir@elitmus-demo.in",
    full_name: "Kabir Sen",
    age: 24,
    gender: "M",
    looking_for: "F",
    city: "Bengaluru",
    role_title: "Solutions Engineer",
    company_domain: "freshworks.com",
    college_name: "Jadavpur University",
    batch: 2023,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "Easygoing weekend cyclist and live music fan keeping things relaxed while settling into BLR.",
    avatar_url: "/avatars/avatar-5.svg",
    relationship_goal: "casual",
    prompts: [
      {
        key: "A perfect Sunday",
        answer: "Morning cycle around Ulsoor Lake and iced coffee with good music.",
      },
      {
        key: "I'm happiest when",
        answer: "Discovering a new indie band at a small gig in Indiranagar.",
      },
    ],
    q1: 3,
    q2: 5,
    q3: 2,
    q4: 4,
    q5: 4,
  },
  {
    email: "siddharth@elitmus-demo.in",
    full_name: "Siddharth Iyer",
    age: 27,
    gender: "M",
    looking_for: "F",
    city: "Bengaluru",
    role_title: "Senior Analyst",
    company_domain: "deloitte.com",
    college_name: "NIT Surathkal",
    batch: 2020,
    hide_same_company: true,
    hide_same_college: false,
    bio_prompt:
      "2020 batch grad ready for something serious, built on shared values and calm communication.",
    avatar_url: "/avatars/avatar-3.svg",
    relationship_goal: "marriage",
    prompts: [
      {
        key: "A small thing I care about",
        answer: "Kindness to waiters, drivers, and people working around us.",
      },
      {
        key: "My ideal first date",
        answer: "A quiet dinner where we can actually hear each other talk.",
      },
    ],
    q1: 4,
    q2: 2,
    q3: 5,
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
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
      console.log(`Auth user already exists (email confirmed): ${user.email}`);
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
      relationship_goal: user.relationship_goal,
      prompts: user.prompts,
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
          reply_to_prompt_key: "A perfect Sunday",
        },
        {
          match_id: matchId,
          sender_id: aaravId,
          content:
            "Thanks Anya! One more thoughtful message from either of us will unblur our photos.",
          reply_to_prompt_key: null,
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
