export interface OptionItem<T extends string = string> {
  value: T;
  label: string;
}

export type ProfileOption<T extends string = string> = OptionItem<T>;

export type GenderValue = "man" | "woman" | "beyond_binary";
export type InterestedInValue = "men" | "women" | "beyond_binary" | "everyone";

export const GENDER_OPTIONS: OptionItem<GenderValue>[] = [
  { value: "man", label: "Man" },
  { value: "woman", label: "Woman" },
  { value: "beyond_binary", label: "Beyond binary" },
];

export const INTERESTED_IN_OPTIONS: OptionItem<InterestedInValue>[] = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "beyond_binary", label: "Beyond binary" },
  { value: "everyone", label: "Everyone" },
];

export const RELATIONSHIP_GOAL_OPTIONS: OptionItem<
  "friendship" | "casual" | "open" | "long_term" | "marriage"
>[] = [
  { value: "friendship", label: "Friendship-first" },
  { value: "casual", label: "Something casual" },
  { value: "open", label: "Open to see where it goes" },
  { value: "long_term", label: "A long-term relationship" },
  { value: "marriage", label: "Marriage" },
];

export const OPEN_TO_OPTIONS: OptionItem[] = [
  { value: "monogamy", label: "Monogamy" },
  { value: "non_monogamy", label: "Non-monogamy" },
  { value: "figuring_it_out", label: "Figuring it out" },
];

export const LANGUAGE_OPTIONS: OptionItem[] = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Kannada", label: "Kannada" },
  { value: "Tamil", label: "Tamil" },
  { value: "Telugu", label: "Telugu" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Marathi", label: "Marathi" },
  { value: "Bengali", label: "Bengali" },
  { value: "Gujarati", label: "Gujarati" },
  { value: "Punjabi", label: "Punjabi" },
  { value: "Urdu", label: "Urdu" },
  { value: "Odia", label: "Odia" },
  { value: "Other", label: "Other" },
];

export const ZODIAC_OPTIONS: OptionItem[] = [
  { value: "aries", label: "Aries" },
  { value: "taurus", label: "Taurus" },
  { value: "gemini", label: "Gemini" },
  { value: "cancer", label: "Cancer" },
  { value: "leo", label: "Leo" },
  { value: "virgo", label: "Virgo" },
  { value: "libra", label: "Libra" },
  { value: "scorpio", label: "Scorpio" },
  { value: "sagittarius", label: "Sagittarius" },
  { value: "capricorn", label: "Capricorn" },
  { value: "aquarius", label: "Aquarius" },
  { value: "pisces", label: "Pisces" },
];

export const EDUCATION_OPTIONS: OptionItem[] = [
  { value: "diploma", label: "Diploma" },
  { value: "bachelors", label: "Bachelor's degree" },
  { value: "masters", label: "Master's degree" },
  { value: "phd", label: "PhD / Doctorate" },
  { value: "other", label: "Other" },
];

export const COMMUNICATION_STYLE_OPTIONS: OptionItem[] = [
  { value: "texts_a_lot", label: "Texts a lot" },
  { value: "replies_in_bursts", label: "Replies in bursts" },
  { value: "better_in_person", label: "Better in person" },
  { value: "short_and_to_the_point", label: "Short and to the point" },
];

export const LOVE_STYLE_OPTIONS: OptionItem[] = [
  { value: "thoughtful_gestures", label: "Thoughtful gestures" },
  { value: "gifts", label: "Gifts" },
  { value: "touch", label: "Touch" },
  { value: "compliments", label: "Compliments" },
  { value: "quality_time", label: "Quality time" },
];

export const PETS_OPTIONS: OptionItem[] = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "both", label: "Dog and cat" },
  { value: "other", label: "Other pet" },
  { value: "none", label: "No pets" },
  { value: "want_one", label: "Want a pet" },
];

export const DRINKING_OPTIONS: OptionItem[] = [
  { value: "not_for_me", label: "Not for me" },
  { value: "sober", label: "Sober" },
  { value: "special_occasions", label: "On special occasions" },
  { value: "socially", label: "Socially" },
  { value: "most_nights", label: "Most nights" },
];

export const SMOKING_OPTIONS: OptionItem[] = [
  { value: "non_smoker", label: "Non-smoker" },
  { value: "social_smoker", label: "Social smoker" },
  { value: "smoker", label: "Smoker" },
  { value: "trying_to_quit", label: "Trying to quit" },
];

export const WORKOUT_OPTIONS: OptionItem[] = [
  { value: "everyday", label: "Every day" },
  { value: "often", label: "Often" },
  { value: "sometimes", label: "Sometimes" },
  { value: "never", label: "Never" },
];

export const INTEREST_OPTIONS: OptionItem[] = [
  { value: "Board games", label: "Board games" },
  { value: "Cricket", label: "Cricket" },
  { value: "Trekking", label: "Trekking" },
  { value: "Filter coffee", label: "Filter coffee" },
  { value: "Cooking", label: "Cooking" },
  { value: "Reading", label: "Reading" },
  { value: "Gaming", label: "Gaming" },
  { value: "Side projects", label: "Side projects" },
  { value: "Movies", label: "Movies" },
  { value: "Music", label: "Music" },
  { value: "Travel", label: "Travel" },
  { value: "Photography", label: "Photography" },
  { value: "Fitness", label: "Fitness" },
  { value: "Dancing", label: "Dancing" },
  { value: "Stand-up comedy", label: "Stand-up comedy" },
  { value: "Podcasts", label: "Podcasts" },
  { value: "Anime", label: "Anime" },
  { value: "Football", label: "Football" },
  { value: "Badminton", label: "Badminton" },
  { value: "Cycling", label: "Cycling" },
  { value: "Street food", label: "Street food" },
  { value: "Art", label: "Art" },
  { value: "Volunteering", label: "Volunteering" },
  { value: "Startups", label: "Startups" },
];

export interface ProfileDetails {
  open_to?: string | null;
  languages?: string[];
  zodiac?: string | null;
  education?: string | null;
  communication_style?: string | null;
  love_style?: string | null;
  pets?: string | null;
  drinking?: string | null;
  smoking?: string | null;
  workout?: string | null;
  interests?: string[];
}

export const SINGLE_DETAIL_CONFIGS: {
  key: keyof Omit<ProfileDetails, "languages" | "interests">;
  label: string;
  options: OptionItem[];
}[] = [
  { key: "open_to", label: "Open to", options: OPEN_TO_OPTIONS },
  { key: "zodiac", label: "Zodiac", options: ZODIAC_OPTIONS },
  { key: "education", label: "Education", options: EDUCATION_OPTIONS },
  {
    key: "communication_style",
    label: "Communication style",
    options: COMMUNICATION_STYLE_OPTIONS,
  },
  { key: "love_style", label: "Love style", options: LOVE_STYLE_OPTIONS },
  { key: "pets", label: "Pets", options: PETS_OPTIONS },
  { key: "drinking", label: "Drinking", options: DRINKING_OPTIONS },
  { key: "smoking", label: "Smoking", options: SMOKING_OPTIONS },
  { key: "workout", label: "Workout", options: WORKOUT_OPTIONS },
];

export function findOptionLabel(
  options: readonly OptionItem[],
  value: string | null | undefined
): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? null;
}

export const getOptionLabel = findOptionLabel;

// Computes completed age in years from an ISO birth_date string (YYYY-MM-DD).
export function computeAgeFromBirthDate(
  birthDateIso: string | null | undefined
): number | null {
  if (!birthDateIso || !/^\d{4}-\d{2}-\d{2}$/.test(birthDateIso)) return null;
  const [y, m, d] = birthDateIso.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
    age--;
  }
  return age;
}

// Derives displayed age from birth_date when available, falling back to stored age.
// Honest limitation: the stored age column in Postgres is only updated when the profile is saved and can go stale over time.
export function getDisplayedAge(profile: {
  birth_date?: string | null;
  age: number;
}): number {
  const derived = computeAgeFromBirthDate(profile.birth_date);
  return derived !== null && derived >= 18 ? derived : profile.age;
}

export function validateBirthDateParts(
  dayStr: string,
  monthStr: string,
  yearStr: string
): { valid: boolean; iso?: string; age?: number; error?: string } {
  const d = Number(dayStr);
  const m = Number(monthStr);
  const y = Number(yearStr);

  if (
    !Number.isInteger(d) ||
    !Number.isInteger(m) ||
    !Number.isInteger(y) ||
    yearStr.trim().length !== 4
  ) {
    return {
      valid: false,
      error: "Enter a complete valid birth date in DD, MM, YYYY format.",
    };
  }

  if (y < 1950) {
    return {
      valid: false,
      error: "Birth year must be 1950 or later.",
    };
  }

  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return {
      valid: false,
      error: "That calendar date does not exist. Check the day and month.",
    };
  }

  const candidate = new Date(Date.UTC(y, m - 1, d));
  if (
    candidate.getUTCFullYear() !== y ||
    candidate.getUTCMonth() !== m - 1 ||
    candidate.getUTCDate() !== d
  ) {
    return {
      valid: false,
      error: "That calendar date does not exist (for example, February 30).",
    };
  }

  const iso = `${String(y).padStart(4, "0")}-${String(m).padStart(
    2,
    "0"
  )}-${String(d).padStart(2, "0")}`;
  const age = computeAgeFromBirthDate(iso);

  if (age === null || age < 18) {
    return {
      valid: false,
      error: "You must be 18 or older to use pHavelength.",
    };
  }

  return { valid: true, iso, age };
}

export function parseBirthDateToParts(
  birthDateIso?: string | null,
  fallbackAge?: number | null
): { day: string; month: string; year: string } {
  if (birthDateIso && /^\d{4}-\d{2}-\d{2}$/.test(birthDateIso)) {
    const [y, m, d] = birthDateIso.split("-");
    return { day: d, month: m, year: y };
  }
  if (typeof fallbackAge === "number" && fallbackAge >= 18) {
    const y = new Date().getFullYear() - fallbackAge;
    return { day: "15", month: "06", year: String(y) };
  }
  return { day: "", month: "", year: "" };
}

export interface DetailChip {
  key: string;
  label: string;
  kind: "interest" | "language" | "detail";
}

export function getProfileDetailChips(
  details?: ProfileDetails | null
): DetailChip[] {
  if (!details || typeof details !== "object") return [];
  const chips: DetailChip[] = [];

  if (Array.isArray(details.interests)) {
    for (const interest of details.interests) {
      const lbl = findOptionLabel(INTEREST_OPTIONS, interest);
      if (lbl) {
        chips.push({
          key: `interest-${interest}`,
          label: lbl,
          kind: "interest",
        });
      }
    }
  }

  if (Array.isArray(details.languages)) {
    for (const lang of details.languages) {
      const lbl = findOptionLabel(LANGUAGE_OPTIONS, lang);
      if (lbl) {
        chips.push({
          key: `lang-${lang}`,
          label: `Speaks ${lbl}`,
          kind: "language",
        });
      }
    }
  }

  for (const cfg of SINGLE_DETAIL_CONFIGS) {
    const rawVal = details[cfg.key];
    if (typeof rawVal === "string" && rawVal) {
      const lbl = findOptionLabel(cfg.options, rawVal);
      if (lbl) {
        chips.push({
          key: `detail-${cfg.key}`,
          label: `${cfg.label}: ${lbl}`,
          kind: "detail",
        });
      }
    }
  }

  return chips;
}
