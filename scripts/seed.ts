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
  birth_date: string;
  gender: "man" | "woman" | "beyond_binary";
  looking_for: "men" | "women" | "beyond_binary" | "everyone";
  city: string;
  role_title: string;
  company_domain: string;
  college_name: string;
  batch: number;
  hide_same_company: boolean;
  hide_same_college: boolean;
  bio_prompt: string;
  avatar_url: string;
  relationship_goal:
    | "friendship"
    | "casual"
    | "open"
    | "long_term"
    | "marriage";
  prompts: { key: string; answer: string }[];
  details: Record<string, unknown>;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  plan?: "free" | "plus" | "pro";
}

const SEED_USERS: SeedUser[] = [
  {
    email: "aarav@elitmus-demo.in",
    full_name: "Aarav Sharma",
    age: 25,
    birth_date: "2001-04-12",
    gender: "man",
    looking_for: "women",
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
    details: {
      open_to: "monogamy",
      languages: ["English", "Hindi", "Tamil"],
      zodiac: "aries",
      education: "bachelors",
      communication_style: "better_in_person",
      love_style: "quality_time",
      pets: "dog",
      drinking: "socially",
      smoking: "non_smoker",
      workout: "often",
      interests: ["Filter coffee", "Reading", "Side projects", "Badminton", "Trekking"],
    },
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
    birth_date: "2002-08-19",
    gender: "woman",
    looking_for: "men",
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
    details: {
      open_to: "monogamy",
      languages: ["English", "Malayalam", "Hindi"],
      zodiac: "leo",
      education: "bachelors",
      communication_style: "texts_a_lot",
      love_style: "thoughtful_gestures",
      pets: "cat",
      drinking: "special_occasions",
      smoking: "non_smoker",
      workout: "sometimes",
      interests: ["Reading", "Filter coffee", "Travel", "Movies", "Board games"],
    },
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
    birth_date: "2001-02-10",
    gender: "woman",
    looking_for: "men",
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
    details: {
      open_to: "monogamy",
      languages: ["English", "Malayalam", "Kannada"],
      education: "bachelors",
      drinking: "not_for_me",
      smoking: "non_smoker",
      workout: "often",
      interests: ["Filter coffee", "Badminton", "Music"],
    },
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
    birth_date: "2000-05-22",
    gender: "woman",
    looking_for: "everyone",
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
    details: {
      open_to: "figuring_it_out",
      languages: ["English", "Marathi", "Hindi"],
      zodiac: "gemini",
      education: "bachelors",
      communication_style: "short_and_to_the_point",
      love_style: "quality_time",
      pets: "none",
      drinking: "sober",
      smoking: "non_smoker",
      workout: "everyday",
      interests: ["Cycling", "Cooking", "Fitness", "Trekking"],
    },
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
    birth_date: "2001-09-14",
    gender: "woman",
    looking_for: "men",
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
    details: {
      open_to: "monogamy",
      languages: ["English", "Tamil", "Hindi"],
      zodiac: "virgo",
      education: "masters",
      communication_style: "better_in_person",
      love_style: "compliments",
      pets: "want_one",
      drinking: "socially",
      smoking: "non_smoker",
      workout: "sometimes",
      interests: ["Art", "Podcasts", "Filter coffee", "Photography"],
    },
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
    birth_date: "2002-01-28",
    gender: "woman",
    looking_for: "men",
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
    details: {
      open_to: "figuring_it_out",
      languages: ["English", "Tamil", "Kannada"],
      education: "bachelors",
      drinking: "special_occasions",
      smoking: "non_smoker",
      workout: "sometimes",
      interests: ["Board games", "Music", "Filter coffee", "Street food"],
    },
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
    birth_date: "2001-07-03",
    gender: "woman",
    looking_for: "men",
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
    details: {
      open_to: "monogamy",
      languages: ["English", "Telugu", "Hindi"],
      zodiac: "cancer",
      education: "bachelors",
      drinking: "not_for_me",
      smoking: "non_smoker",
      workout: "often",
      interests: ["Trekking", "Reading", "Travel", "Startups"],
    },
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
    birth_date: "2002-03-17",
    gender: "woman",
    looking_for: "men",
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
    details: {
      open_to: "monogamy",
      languages: ["English", "Kannada", "Marathi", "Hindi"],
      zodiac: "pisces",
      education: "bachelors",
      communication_style: "replies_in_bursts",
      love_style: "quality_time",
      pets: "dog",
      drinking: "special_occasions",
      smoking: "non_smoker",
      workout: "often",
      interests: ["Badminton", "Music", "Filter coffee", "Cycling"],
    },
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
    birth_date: "2002-10-08",
    gender: "woman",
    looking_for: "everyone",
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
    details: {
      open_to: "figuring_it_out",
      languages: ["English", "Hindi", "Malayalam"],
      zodiac: "libra",
      education: "bachelors",
      love_style: "thoughtful_gestures",
      drinking: "socially",
      smoking: "non_smoker",
      workout: "sometimes",
      interests: ["Art", "Music", "Movies", "Photography"],
    },
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
    birth_date: "2003-04-05",
    gender: "woman",
    looking_for: "men",
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
    details: {
      open_to: "figuring_it_out",
      languages: ["English", "Hindi", "Punjabi"],
      education: "bachelors",
      drinking: "socially",
      smoking: "non_smoker",
      workout: "sometimes",
      interests: ["Stand-up comedy", "Filter coffee", "Travel", "Street food"],
    },
    q1: 4,
    q2: 5,
    q3: 2,
    q4: 4,
    q5: 4,
  },
  {
    email: "rohan@elitmus-demo.in",
    full_name: "Rohan Verma",
    plan: "plus",
    age: 26,
    birth_date: "2000-06-11",
    gender: "man",
    looking_for: "women",
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
    details: {
      open_to: "monogamy",
      languages: ["English", "Hindi", "Punjabi"],
      education: "masters",
      love_style: "thoughtful_gestures",
      drinking: "socially",
      smoking: "non_smoker",
      workout: "often",
      interests: ["Cooking", "Badminton", "Fitness", "Movies"],
    },
    q1: 4,
    q2: 3,
    q3: 4,
    q4: 4,
    q5: 4,
  },
  {
    email: "vikram@elitmus-demo.in",
    full_name: "Vikram Joshi",
    plan: "pro",
    age: 25,
    birth_date: "2001-11-02",
    gender: "man",
    looking_for: "everyone",
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
    details: {
      open_to: "figuring_it_out",
      languages: ["English", "Kannada", "Hindi"],
      education: "bachelors",
      drinking: "special_occasions",
      smoking: "non_smoker",
      workout: "sometimes",
      interests: ["Music", "Filter coffee", "Side projects", "Podcasts"],
    },
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
    birth_date: "2000-02-20",
    gender: "man",
    looking_for: "women",
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
    details: {
      open_to: "monogamy",
      languages: ["English", "Hindi"],
      education: "bachelors",
      drinking: "not_for_me",
      smoking: "non_smoker",
      workout: "everyday",
      interests: ["Fitness", "Cooking", "Trekking", "Startups"],
    },
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
    birth_date: "2002-07-15",
    gender: "beyond_binary",
    looking_for: "everyone",
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
    details: {
      open_to: "figuring_it_out",
      languages: ["English", "Kannada", "Telugu"],
      education: "masters",
      drinking: "socially",
      smoking: "non_smoker",
      workout: "sometimes",
      interests: ["Photography", "Reading", "Filter coffee", "Art"],
    },
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
    birth_date: "2002-05-09",
    gender: "man",
    looking_for: "women",
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
    details: {
      open_to: "figuring_it_out",
      languages: ["English", "Bengali", "Hindi"],
      education: "bachelors",
      drinking: "socially",
      smoking: "non_smoker",
      workout: "often",
      interests: ["Cycling", "Music", "Football", "Street food"],
    },
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
    birth_date: "1999-08-25",
    gender: "man",
    looking_for: "women",
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
    details: {
      open_to: "monogamy",
      languages: ["English", "Tamil", "Kannada", "Hindi"],
      education: "masters",
      drinking: "not_for_me",
      smoking: "non_smoker",
      workout: "often",
      interests: ["Cricket", "Reading", "Filter coffee", "Volunteering"],
    },
    q1: 4,
    q2: 2,
    q3: 5,
    q4: 5,
    q5: 3,
  },
];

const MALE_NAMES = [
  "Aditya Menon", "Rishabh Gupta", "Pranav Kulkarni", "Karan Malhotra", "Nikhil Reddy",
  "Harshvardhan Joshi", "Varun Iyer", "Siddhant Kapoor", "Gaurav Nair", "Abhishek Verma",
  "Tanmay Deshmukh", "Shubham Agarwal", "Akash Chatterjee", "Yashwant Rao", "Manish Tiwari",
  "Chirag Bansal", "Anirudh Krishnan", "Kunal Saxena", "Deepak Choudhary", "Saurabh Mishra",
  "Vivek Shetty", "Rajat Khanna", "Mayank Sinha", "Ashwin Hegde", "Nitin Kulkarni",
];

const FEMALE_NAMES = [
  "Aditi Rao", "Ishita Sharma", "Kavya Nair", "Nandini Iyer", "Pooja Deshmukh",
  "Roshni Menon", "Shruti Kulkarni", "Tanvi Joshi", "Vaishnavi Reddy", "Zoya Khan",
  "Bhavna Gupta", "Charu Malhotra", "Diya Chatterjee", "Esha Verma", "Gauri Bansal",
  "Himani Tiwari", "Jhanvi Kapoor", "Komal Agarwal", "Lavanya Krishnan", "Mansi Saxena",
  "Niharika Sinha", "Ojaswi Hegde", "Pallavi Mishra", "Radhika Shetty", "Swati Khanna",
];

const CITIES = ["Bengaluru", "Bengaluru", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Mumbai", "NCR"];
const ROLES = ["Software Engineer", "Product Analyst", "Backend Developer", "Frontend Engineer", "Data Analyst", "UX Designer", "QA Engineer", "Cloud Engineer"];
const COMPANIES = ["infosys.com", "tcs.com", "zoho.com", "freshworks.com", "postman.com", "razorpay.com", "cred.club", "swiggy.in"];
const COLLEGES = ["NIT Trichy", "VIT Vellore", "BITS Pilani", "RVCE Bengaluru", "IIIT Hyderabad", "COEP Pune", "SRM Chennai", "DTU Delhi"];
const GOALS: SeedUser["relationship_goal"][] = ["long_term", "open", "marriage", "casual", "friendship"];
const INTEREST_POOL = [
  "Filter coffee", "Reading", "Badminton", "Trekking", "Cooking", "Music",
  "Photography", "Board games", "Cycling", "Movies", "Side projects", "Street food",
  "Fitness", "Travel", "Stand-up comedy", "Podcasts", "Cricket", "Art",
];

function buildExtraUsers(): SeedUser[] {
  const extras: SeedUser[] = [];

  for (let i = 0; i < 25; i++) {
    const city = CITIES[i % CITIES.length];
    const birthYear = 1998 + (i % 6);
    const goal = GOALS[i % GOALS.length];
    extras.push({
      email: `demo-m${i + 1}@elitmus-demo.in`,
      full_name: MALE_NAMES[i],
      age: 2026 - birthYear,
      birth_date: `${birthYear}-0${(i % 9) + 1}-1${i % 9}`,
      gender: "man",
      looking_for: i % 5 === 0 ? "everyone" : "women",
      city,
      role_title: ROLES[i % ROLES.length],
      company_domain: COMPANIES[i % COMPANIES.length],
      college_name: COLLEGES[i % COLLEGES.length],
      batch: 2020 + (i % 5),
      hide_same_company: true,
      hide_same_college: false,
      bio_prompt: `${2020 + (i % 5)} grad in ${city}. Into ${INTEREST_POOL[i % INTEREST_POOL.length].toLowerCase()} and unhurried conversations.`,
      avatar_url: `/avatars/avatar-${(i % 6) + 1}.svg`,
      relationship_goal: goal,
      prompts: [
        {
          key: "A perfect Sunday",
          answer: `Morning coffee in ${city}, a bit of ${INTEREST_POOL[i % INTEREST_POOL.length].toLowerCase()}, and good company.`,
        },
        {
          key: "A small thing I care about",
          answer: "Being punctual, honest, and present during real conversations.",
        },
      ],
      details: {
        open_to: goal === "casual" ? "figuring_it_out" : "monogamy",
        languages: ["English", "Hindi"],
        education: i % 3 === 0 ? "masters" : "bachelors",
        drinking: i % 2 === 0 ? "socially" : "not_for_me",
        smoking: "non_smoker",
        workout: i % 2 === 0 ? "often" : "sometimes",
        interests: [
          INTEREST_POOL[i % INTEREST_POOL.length],
          INTEREST_POOL[(i + 3) % INTEREST_POOL.length],
          INTEREST_POOL[(i + 6) % INTEREST_POOL.length],
        ],
      },
      q1: 2 + (i % 4),
      q2: 2 + ((i + 1) % 4),
      q3: 2 + ((i + 2) % 4),
      q4: 3 + (i % 3),
      q5: 2 + ((i + 1) % 4),
    });
  }

  for (let i = 0; i < 25; i++) {
    const city = CITIES[i % CITIES.length];
    const birthYear = 1998 + (i % 6);
    const goal = GOALS[i % GOALS.length];
    extras.push({
      email: `demo-f${i + 1}@elitmus-demo.in`,
      full_name: FEMALE_NAMES[i],
      age: 2026 - birthYear,
      birth_date: `${birthYear}-0${(i % 9) + 1}-2${i % 8}`,
      gender: "woman",
      looking_for: i % 5 === 0 ? "everyone" : "men",
      city,
      role_title: ROLES[(i + 2) % ROLES.length],
      company_domain: COMPANIES[(i + 3) % COMPANIES.length],
      college_name: COLLEGES[(i + 2) % COLLEGES.length],
      batch: 2020 + (i % 5),
      hide_same_company: true,
      hide_same_college: false,
      bio_prompt: `${2020 + (i % 5)} batch in ${city}. Enjoys ${INTEREST_POOL[(i + 2) % INTEREST_POOL.length].toLowerCase()} and thoughtful weekend plans.`,
      avatar_url: `/avatars/avatar-${((i + 2) % 6) + 1}.svg`,
      relationship_goal: goal,
      prompts: [
        {
          key: "My ideal first date",
          answer: `Filter coffee or a quiet walk in ${city} where we can actually talk.`,
        },
        {
          key: "I'm happiest when",
          answer: `Spending a relaxed afternoon with ${INTEREST_POOL[(i + 2) % INTEREST_POOL.length].toLowerCase()} and no rush.`,
        },
      ],
      details: {
        open_to: goal === "casual" ? "figuring_it_out" : "monogamy",
        languages: ["English", "Hindi"],
        education: i % 4 === 0 ? "masters" : "bachelors",
        drinking: i % 2 === 0 ? "special_occasions" : "socially",
        smoking: "non_smoker",
        workout: i % 2 === 0 ? "often" : "sometimes",
        interests: [
          INTEREST_POOL[(i + 2) % INTEREST_POOL.length],
          INTEREST_POOL[(i + 5) % INTEREST_POOL.length],
          INTEREST_POOL[(i + 8) % INTEREST_POOL.length],
        ],
      },
      q1: 2 + ((i + 1) % 4),
      q2: 2 + (i % 4),
      q3: 3 + (i % 3),
      q4: 2 + ((i + 2) % 4),
      q5: 3 + (i % 3),
    });
  }

  return extras;
}

const ALL_SEED_USERS: SeedUser[] = [...SEED_USERS, ...buildExtraUsers()];

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

  for (const user of ALL_SEED_USERS) {
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
      birth_date: user.birth_date,
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
      details: user.details,
      q1: user.q1,
      q2: user.q2,
      q3: user.q3,
      q4: user.q4,
      q5: user.q5,
      dpdp_consent_at: now,
      house_rules_accepted_at: now,
      plan: user.plan ?? "free",
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

  // Seed one zero-message match between Aarav and Meera (for testing Pass & Undo)
  const meeraId = idByEmail["meera@elitmus-demo.in"];
  if (aaravId && meeraId) {
    const { data: existingZeroMatch } = await supabaseAdmin
      .from("matches")
      .select("id")
      .or(
        `and(user_a.eq.${aaravId},user_b.eq.${meeraId}),and(user_a.eq.${meeraId},user_b.eq.${aaravId})`
      )
      .maybeSingle();

    if (!existingZeroMatch) {
      const { error: zeroErr } = await supabaseAdmin.from("matches").insert({
        user_a: aaravId,
        user_b: meeraId,
        compatibility_score: 85,
      });
      if (zeroErr) throw zeroErr;
      console.log("Seeded zero-message match between Aarav and Meera.");
    }
  }

  // Seed Level 3 matches (4 valid 4+ word messages, 2 from each side) for Free, Plus, and Pro testing
  async function seedLevel3Match(
    emailA: string,
    emailB: string,
    score: number,
    msgs: { fromA: boolean; content: string }[]
  ) {
    const idA = idByEmail[emailA];
    const idB = idByEmail[emailB];
    if (!idA || !idB) return;

    const { data: existing } = await supabaseAdmin
      .from("matches")
      .select("id")
      .or(
        `and(user_a.eq.${idA},user_b.eq.${idB}),and(user_a.eq.${idB},user_b.eq.${idA})`
      )
      .maybeSingle();

    if (existing) return;

    const { data: inserted, error: err } = await supabaseAdmin
      .from("matches")
      .insert({ user_a: idA, user_b: idB, compatibility_score: score })
      .select("id")
      .single();
    if (err) throw err;

    await supabaseAdmin.from("messages").insert(
      msgs.map((m) => ({
        match_id: inserted.id,
        sender_id: m.fromA ? idA : idB,
        content: m.content,
        reply_to_prompt_key: null,
      }))
    );
    console.log(`Seeded Level 3 match between ${emailA} and ${emailB}.`);
  }

  await seedLevel3Match("aarav@elitmus-demo.in", "priya@elitmus-demo.in", 92, [
    { fromA: true, content: "Hey Priya, how was your weekend hike near Nandi Hills?" },
    { fromA: false, content: "It was great Aarav, we caught the sunrise right above the clouds." },
    { fromA: true, content: "That sounds amazing! Which trail did you end up taking?" },
    { fromA: false, content: "We took the main steps early morning before the crowd arrived." },
  ]);

  await seedLevel3Match("rohan@elitmus-demo.in", "kriti@elitmus-demo.in", 94, [
    { fromA: true, content: "Hi Kriti, loved your note about weekend board game nights." },
    { fromA: false, content: "Thanks Rohan! Do you play Catan or more strategy card games?" },
    { fromA: true, content: "Mostly Catan and Ticket to Ride with a small group in Indiranagar." },
    { fromA: false, content: "Nice, we should definitely compare favorite board games sometime soon." },
  ]);

  await seedLevel3Match("vikram@elitmus-demo.in", "sneha@elitmus-demo.in", 96, [
    { fromA: true, content: "Hey Sneha, saw you also enjoy filter coffee walks on Sundays." },
    { fromA: false, content: "Yes Vikram! Always looking for new quiet cafes around Koramangala." },
    { fromA: true, content: "Have you tried the small roastery near third block yet?" },
    { fromA: false, content: "Not yet, let us plan a quick catch-up there next weekend." },
  ]);

  // Revoke any previously unmatched flags so all prior matches are restored
  const { error: revokeErr } = await supabaseAdmin
    .from("matches")
    .update({ unmatched_at: null, unmatched_by: null })
    .not("unmatched_at", "is", null);
  if (revokeErr) {
    console.warn("Note: could not revoke unmatched_at (ensure migrations_improvements.sql is run):", revokeErr.message);
  } else {
    console.log("Revoked any previously unmatched profiles.");
  }

  console.log(`Seed complete! (${ALL_SEED_USERS.length} users processed)`);
}

runSeed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
