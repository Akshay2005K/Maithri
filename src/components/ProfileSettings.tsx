"use client";

import { useState } from "react";
import {
  supabase,
  PROMPT_KEYS,
  type Profile,
  type ProfilePrompt,
  type RelationshipGoal,
} from "@/lib/supabase";
import {
  COMMUNICATION_STYLE_OPTIONS,
  DRINKING_OPTIONS,
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  INTERESTED_IN_OPTIONS,
  INTEREST_OPTIONS,
  LANGUAGE_OPTIONS,
  LOVE_STYLE_OPTIONS,
  OPEN_TO_OPTIONS,
  PETS_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
  SMOKING_OPTIONS,
  WORKOUT_OPTIONS,
  ZODIAC_OPTIONS,
  parseBirthDateToParts,
  validateBirthDateParts,
  type ProfileDetails,
} from "@/lib/profileOptions";
import PillPicker from "./PillPicker";
import PickerRow from "./PickerRow";

const AVATAR_OPTIONS = [
  "/avatars/avatar-1.svg",
  "/avatars/avatar-2.svg",
  "/avatars/avatar-3.svg",
  "/avatars/avatar-4.svg",
  "/avatars/avatar-5.svg",
  "/avatars/avatar-6.svg",
];

const QUIZ_QUESTIONS = [
  {
    key: "q1" as const,
    title: "Work-life rhythm",
    prompt: "How do you balance career ambition with personal downtime?",
    low: "Strict 9-to-6 boundaries",
    high: "High-growth startup pace",
  },
  {
    key: "q2" as const,
    title: "Weekend social battery",
    prompt: "How do you prefer to recharge on Saturday and Sunday?",
    low: "Quiet reading, rest, and home cooking",
    high: "Outings, events, and social plans",
  },
  {
    key: "q3" as const,
    title: "Financial style",
    prompt: "How do you approach spending versus saving in your twenties?",
    low: "Spend freely on experiences now",
    high: "Disciplined saving and investing first",
  },
  {
    key: "q4" as const,
    title: "Conflict resolution",
    prompt: "When a disagreement happens, what feels healthiest to you?",
    low: "Take quiet space before talking",
    high: "Discuss directly right away",
  },
  {
    key: "q5" as const,
    title: "City and future flexibility",
    prompt: "How open are you to relocating cities over the next few years?",
    low: "Prefer staying settled in my city",
    high: "Open to moving cities or abroad",
  },
];

interface ProfileSettingsProps {
  profile: Profile;
  userEmail: string;
  onSaved: (updated: Profile) => void;
  onProfileQuietUpdate?: (updated: Profile) => void;
  onCancel: () => void;
  onDeleteAccount: () => Promise<void>;
  deleting: boolean;
  deleteError: string | null;
}

export default function ProfileSettings({
  profile,
  userEmail,
  onSaved,
  onProfileQuietUpdate,
  onCancel,
  onDeleteAccount,
  deleting,
  deleteError,
}: ProfileSettingsProps) {
  const initialBirthParts = parseBirthDateToParts(
    profile.birth_date,
    profile.age
  );

  const [fullName, setFullName] = useState(profile.full_name);
  const [birthDay, setBirthDay] = useState(initialBirthParts.day);
  const [birthMonth, setBirthMonth] = useState(initialBirthParts.month);
  const [birthYear, setBirthYear] = useState(initialBirthParts.year);
  const [isOver18Confirmed, setIsOver18Confirmed] = useState(profile.age >= 18);
  const [dpdpConsent, setDpdpConsent] = useState(
    Boolean(profile.dpdp_consent_at ?? true)
  );

  const [gender, setGender] = useState<string | null>(profile.gender);
  const [lookingFor, setLookingFor] = useState(profile.looking_for);
  const [city, setCity] = useState(profile.city);
  const [roleTitle, setRoleTitle] = useState(profile.role_title ?? "");
  const [companyDomain, setCompanyDomain] = useState(
    profile.company_domain ?? ""
  );
  const [collegeName, setCollegeName] = useState(profile.college_name ?? "");
  const [batch, setBatch] = useState(profile.batch ?? 2022);
  const [hideSameCompany, setHideSameCompany] = useState(
    profile.hide_same_company
  );
  const [hideSameCollege, setHideSameCollege] = useState(
    profile.hide_same_college
  );
  const [bioPrompt, setBioPrompt] = useState(profile.bio_prompt ?? "");
  const [avatarUrl, setAvatarUrl] = useState(
    profile.avatar_url ?? AVATAR_OPTIONS[0]
  );
  const [relationshipGoal, setRelationshipGoal] = useState<
    RelationshipGoal | ""
  >(profile.relationship_goal ?? "");

  const [details, setDetails] = useState<ProfileDetails>(() =>
    profile.details && typeof profile.details === "object"
      ? profile.details
      : {}
  );
  const [isIncognito, setIsIncognito] = useState(Boolean(profile.is_incognito));
  const [nonSmokerOnly, setNonSmokerOnly] = useState(
    Boolean(profile.deal_breakers?.non_smoker_only)
  );
  const [minAgePref, setMinAgePref] = useState<string>(
    profile.deal_breakers?.min_age ? String(profile.deal_breakers.min_age) : ""
  );
  const [maxAgePref, setMaxAgePref] = useState<string>(
    profile.deal_breakers?.max_age ? String(profile.deal_breakers.max_age) : ""
  );

  const [prompts, setPrompts] = useState<ProfilePrompt[]>(() => {
    const existing = Array.isArray(profile.prompts) ? profile.prompts : [];
    if (existing.length >= 2) return existing.slice(0, 3);
    if (existing.length === 1) {
      const nextKey =
        PROMPT_KEYS.find((k) => k !== existing[0].key) ?? PROMPT_KEYS[1];
      return [existing[0], { key: nextKey, answer: "" }];
    }
    return [
      { key: PROMPT_KEYS[0], answer: "" },
      { key: PROMPT_KEYS[1], answer: "" },
    ];
  });

  const [answers, setAnswers] = useState({
    q1: profile.q1 ?? 3,
    q2: profile.q2 ?? 3,
    q3: profile.q3 ?? 3,
    q4: profile.q4 ?? 3,
    q5: profile.q5 ?? 3,
  });

  const [error, setError] = useState<string | null>(null);
  const [detailsStatus, setDetailsStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function persistDetailsUpdate(
    nextDetails: ProfileDetails,
    nextGoal?: RelationshipGoal | ""
  ) {
    setDetails(nextDetails);
    setDetailsStatus(null);

    const payload: Record<string, unknown> = { details: nextDetails };
    if (typeof nextGoal !== "undefined") {
      payload.relationship_goal = nextGoal || null;
    }

    const { data, error: dbErr } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profile.id)
      .select()
      .single();

    if (!dbErr && data) {
      setDetailsStatus("Saved to your profile.");
      onProfileQuietUpdate?.(data as Profile);
    }
  }

  async function handleSaveAll(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Enter your first name before saving.");
      return;
    }

    const birthCheck = validateBirthDateParts(birthDay, birthMonth, birthYear);
    if (!birthCheck.valid || !birthCheck.iso || !birthCheck.age) {
      setError(
        birthCheck.error ??
          "Enter a valid birthday (DD, MM, YYYY). You must be 18 or older."
      );
      return;
    }

    if (!isOver18Confirmed) {
      setError(
        "Please check the 18+ confirmation box to verify you are 18 years of age or older."
      );
      return;
    }

    if (!dpdpConsent) {
      setError("Please keep the DPDP consent box checked to save changes.");
      return;
    }

    if (!gender) {
      setError("Select your gender before saving.");
      return;
    }

    if (!lookingFor) {
      setError("Select who you are interested in meeting.");
      return;
    }

    if (!relationshipGoal) {
      setError("Select what you are looking for before saving.");
      return;
    }

    const cleanedPrompts = prompts.map((p) => ({
      key: p.key,
      answer: p.answer.trim(),
    }));
    if (cleanedPrompts.length < 2 || cleanedPrompts.length > 3) {
      setError("Complete at least 2 prompts (and at most 3) before saving.");
      return;
    }
    const seenKeys = new Set<string>();
    for (const item of cleanedPrompts) {
      if (seenKeys.has(item.key)) {
        setError(
          `Pick a different prompt topic for each slot ("${item.key}" is selected twice).`
        );
        return;
      }
      seenKeys.add(item.key);
      if (item.answer.length < 10 || item.answer.length > 200) {
        setError(
          `Your answer for "${item.key}" must be between 10 and 200 characters (currently ${item.answer.length}).`
        );
        return;
      }
    }

    setSaving(true);
    const { data, error: dbError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        age: birthCheck.age,
        birth_date: birthCheck.iso,
        gender,
        looking_for: lookingFor,
        city: city.trim(),
        role_title: roleTitle.trim() || null,
        company_domain: companyDomain.trim().toLowerCase() || null,
        college_name: collegeName.trim() || null,
        batch: Number(batch),
        hide_same_company: hideSameCompany,
        hide_same_college: hideSameCollege,
        is_incognito: isIncognito,
        deal_breakers: {
          non_smoker_only: nonSmokerOnly,
          min_age: minAgePref ? Math.max(18, Number(minAgePref)) : null,
          max_age: maxAgePref ? Math.max(18, Number(maxAgePref)) : null,
        },
        bio_prompt: bioPrompt.trim() || null,
        avatar_url: avatarUrl,
        relationship_goal: relationshipGoal,
        prompts: cleanedPrompts,
        details,
        q1: answers.q1,
        q2: answers.q2,
        q3: answers.q3,
        q4: answers.q4,
        q5: answers.q5,
      })
      .eq("id", profile.id)
      .select()
      .single();

    setSaving(false);

    if (dbError) {
      setError(`${dbError.message} Check your fields and try saving again.`);
      return;
    }

    onSaved(data as Profile);
  }

  return (
    <section className="mx-auto w-full max-w-[920px] space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dusk/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-dusk">Edit profile</h1>
          <p className="mt-1 text-sm font-medium text-ink">
            Signed in as <strong>{profile.full_name}</strong> ({userEmail})
          </p>
          <p className="mt-0.5 text-xs text-ink/75">
            Simulated eLitmus verification (prototype)
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-4 text-sm font-medium text-dusk hover:bg-dusk/10"
        >
          Back to matches
        </button>
      </div>

      <form
        onSubmit={handleSaveAll}
        className="space-y-8 rounded-lg border border-dusk/20 bg-fog p-6 sm:p-8"
      >
        {/* Two columns on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Left column: First name, Email (verified), Birthday (DD/MM/YYYY), Gender, Interested in, Looking for */}
          <div className="space-y-5 md:col-span-7">
            <div>
              <label
                htmlFor="prof-first-name"
                className="block text-sm font-medium text-ink"
              >
                First name
              </label>
              <input
                id="prof-first-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="prof-email"
                  className="block text-sm font-medium text-ink"
                >
                  Email
                </label>
                <span className="inline-flex items-center gap-1 rounded border border-teal/50 bg-teal/15 px-2 py-0.5 text-xs font-medium text-ink">
                  <span aria-hidden="true">✓</span> Verified
                </span>
              </div>
              <input
                id="prof-email"
                type="email"
                readOnly
                value={userEmail}
                className="mt-1.5 min-h-[44px] w-full cursor-not-allowed rounded border border-dusk/20 bg-dusk/5 px-3 py-2 text-sm text-ink/80"
              />
            </div>

            {/* Birthday as three fields: DD, MM, YYYY */}
            <fieldset>
              <legend className="text-sm font-medium text-ink">
                Birthday (18 or older)
              </legend>
              <div className="mt-1.5 grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="prof-birth-dd"
                    className="block text-xs font-medium text-ink/80"
                  >
                    DD
                  </label>
                  <input
                    id="prof-birth-dd"
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    required
                    placeholder="DD"
                    value={birthDay}
                    onChange={(e) =>
                      setBirthDay(e.target.value.replace(/\D/g, ""))
                    }
                    className="mt-1 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-center text-sm text-ink"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prof-birth-mm"
                    className="block text-xs font-medium text-ink/80"
                  >
                    MM
                  </label>
                  <input
                    id="prof-birth-mm"
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    required
                    placeholder="MM"
                    value={birthMonth}
                    onChange={(e) =>
                      setBirthMonth(e.target.value.replace(/\D/g, ""))
                    }
                    className="mt-1 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-center text-sm text-ink"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prof-birth-yyyy"
                    className="block text-xs font-medium text-ink/80"
                  >
                    YYYY
                  </label>
                  <input
                    id="prof-birth-yyyy"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    placeholder="YYYY"
                    value={birthYear}
                    onChange={(e) =>
                      setBirthYear(e.target.value.replace(/\D/g, ""))
                    }
                    className="mt-1 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-center text-sm text-ink"
                  />
                </div>
              </div>
            </fieldset>

            {/* Gender (PillPicker) */}
            <PillPicker
              mode="single"
              label="Gender"
              required
              placeholder="Add gender"
              dialogTitle="Select your gender"
              options={GENDER_OPTIONS}
              value={gender}
              onChange={(val) => setGender(val)}
            />

            {/* Interested in (four single-select pills) */}
            <fieldset>
              <legend className="mb-1.5 block text-xs font-medium text-ink">
                Interested in <span aria-hidden="true">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {INTERESTED_IN_OPTIONS.map((opt) => {
                  const selected = lookingFor === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setLookingFor(opt.value)}
                      className={`inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        selected
                          ? "border-teal bg-dusk text-fog"
                          : "border-dusk/30 bg-fog text-ink hover:border-dusk hover:bg-dusk/5"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Looking for (PillPicker using existing relationship goal values and labels) */}
            <PillPicker
              mode="single"
              label="Looking for"
              required
              placeholder="Add relationship goal"
              dialogTitle="What are you looking for?"
              options={RELATIONSHIP_GOAL_OPTIONS}
              value={relationshipGoal || null}
              onChange={(val) =>
                setRelationshipGoal((val as RelationshipGoal) ?? "")
              }
            />
          </div>

          {/* Right column: Choose your avatar (3x2 grid) */}
          <div className="md:col-span-5">
            <fieldset className="rounded-lg border border-dusk/15 bg-dusk/5 p-5">
              <legend className="px-1 text-sm font-semibold text-dusk">
                Choose your avatar
              </legend>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {AVATAR_OPTIONS.map((url, idx) => {
                  const selected = avatarUrl === url;
                  return (
                    <button
                      key={url}
                      type="button"
                      aria-label={`Select avatar ${idx + 1}`}
                      aria-pressed={selected}
                      onClick={() => setAvatarUrl(url)}
                      className={`relative flex aspect-square min-h-[72px] items-center justify-center rounded-xl border-2 p-2 transition-colors ${
                        selected
                          ? "border-teal bg-teal/15 ring-2 ring-teal"
                          : "border-dusk/20 bg-fog hover:border-dusk/50"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Avatar illustration ${idx + 1}`}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                      {selected && (
                        <span
                          aria-hidden="true"
                          className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal text-xs font-bold text-[#12122B]"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink/75">
                Pick the avatar that fits you. Photo uploads aren&apos;t part of
                this prototype.
              </p>
            </fieldset>
          </div>
        </div>

        {/* Full width 1: Work and privacy */}
        <section className="space-y-4 rounded-lg border border-dusk/15 bg-dusk/5 p-5">
          <div>
            <h2 className="text-base font-semibold text-dusk">
              Work and privacy
            </h2>
            <p className="mt-0.5 text-xs text-ink/75">
              City, batch, role, company domain, and college are self-declared
              in this prototype (simulated eLitmus verification).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="prof-city"
                className="block text-sm font-medium text-ink"
              >
                City
              </label>
              <select
                id="prof-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
              >
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
                <option value="NCR">NCR</option>
                <option value="Chennai">Chennai</option>
                <option value="Mumbai">Mumbai</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="prof-batch"
                className="block text-sm font-medium text-ink"
              >
                Batch
              </label>
              <select
                id="prof-batch"
                value={batch}
                onChange={(e) => setBatch(Number(e.target.value))}
                className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
              >
                <option value={2020}>2020</option>
                <option value={2021}>2021</option>
                <option value={2022}>2022</option>
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="prof-role"
                className="block text-sm font-medium text-ink"
              >
                Role
              </label>
              <input
                id="prof-role"
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink placeholder:text-ink/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="prof-company-domain"
                className="block text-sm font-medium text-ink"
              >
                Company domains (comma-separated)
              </label>
              <input
                id="prof-company-domain"
                type="text"
                value={companyDomain}
                onChange={(e) => setCompanyDomain(e.target.value)}
                placeholder="e.g. flipkart.com, myntra.com"
                className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink placeholder:text-ink/50"
              />
            </div>

            <div>
              <label
                htmlFor="prof-college"
                className="block text-sm font-medium text-ink"
              >
                Colleges (comma-separated)
              </label>
              <input
                id="prof-college"
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. NIT Trichy, IIM Bangalore"
                className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink placeholder:text-ink/50"
              />
            </div>
          </div>

          <div className="space-y-1 border-t border-dusk/15 pt-3">
            <p className="text-xs font-semibold text-dusk">Privacy Shield</p>
            <label
              htmlFor="prof-hide-company"
              className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink"
            >
              <input
                id="prof-hide-company"
                type="checkbox"
                checked={hideSameCompany}
                onChange={(e) => setHideSameCompany(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-teal"
              />
              <span>
                Hide profiles with my company domain (avoid matching coworkers)
              </span>
            </label>
            <label
              htmlFor="prof-hide-college"
              className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink"
            >
              <input
                id="prof-hide-college"
                type="checkbox"
                checked={hideSameCollege}
                onChange={(e) => setHideSameCollege(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-teal"
              />
              <span>Hide profiles from my college</span>
            </label>
            <label
              htmlFor="prof-incognito"
              className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink"
            >
              <input
                id="prof-incognito"
                type="checkbox"
                checked={isIncognito}
                onChange={(e) => setIsIncognito(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-teal"
              />
              <span>
                Incognito mode (hide me from new daily matches; existing matches
                can still chat)
              </span>
            </label>
          </div>

          <div className="space-y-3 border-t border-dusk/15 pt-3">
            <p className="text-xs font-semibold text-dusk">
              Deal-breakers (optional)
            </p>
            <label
              htmlFor="prof-non-smoker-only"
              className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink"
            >
              <input
                id="prof-non-smoker-only"
                type="checkbox"
                checked={nonSmokerOnly}
                onChange={(e) => setNonSmokerOnly(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-teal"
              />
              <span>Exclude profiles marked as Smoker</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
              <div>
                <label
                  htmlFor="prof-min-age"
                  className="block text-xs font-medium text-ink/80"
                >
                  Min age (18+)
                </label>
                <input
                  id="prof-min-age"
                  type="number"
                  min={18}
                  max={99}
                  placeholder="Any"
                  value={minAgePref}
                  onChange={(e) => setMinAgePref(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
                />
              </div>
              <div>
                <label
                  htmlFor="prof-max-age"
                  className="block text-xs font-medium text-ink/80"
                >
                  Max age
                </label>
                <input
                  id="prof-max-age"
                  type="number"
                  min={18}
                  max={99}
                  placeholder="Any"
                  value={maxAgePref}
                  onChange={(e) => setMaxAgePref(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Full width 2: Prompts */}
        <fieldset className="space-y-4 rounded-lg border border-dusk/15 bg-dusk/5 p-5">
          <div>
            <legend className="text-base font-semibold text-dusk">
              Prompts (minimum 2)
            </legend>
            <p className="mt-0.5 text-xs text-ink/75">
              Matches read these before chatting and reply to one on their first
              message. Keep each answer between 10 and 200 characters.
            </p>
          </div>

          {prompts.map((item, idx) => (
            <div
              key={idx}
              className="space-y-2 rounded border border-dusk/15 bg-fog p-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor={`prof-prompt-key-${idx}`}
                  className="text-xs font-medium text-ink"
                >
                  Prompt topic {idx + 1}
                </label>
                {idx === 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPrompts((prev) => prev.filter((_, i) => i !== 2))
                    }
                    className="inline-flex min-h-[44px] items-center rounded px-2 text-xs font-medium text-dusk underline underline-offset-4"
                  >
                    Remove third prompt
                  </button>
                )}
              </div>

              <select
                id={`prof-prompt-key-${idx}`}
                value={item.key}
                onChange={(e) =>
                  setPrompts((prev) =>
                    prev.map((p, i) =>
                      i === idx ? { ...p, key: e.target.value } : p
                    )
                  )
                }
                className="min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
              >
                {PROMPT_KEYS.map((key) => {
                  const usedElsewhere = prompts.some(
                    (other, otherIdx) => otherIdx !== idx && other.key === key
                  );
                  return (
                    <option key={key} value={key} disabled={usedElsewhere}>
                      {key}
                    </option>
                  );
                })}
              </select>

              <div>
                <label
                  htmlFor={`prof-prompt-answer-${idx}`}
                  className="block text-xs font-medium text-ink"
                >
                  Your answer
                </label>
                <textarea
                  id={`prof-prompt-answer-${idx}`}
                  rows={2}
                  maxLength={200}
                  value={item.answer}
                  onChange={(e) =>
                    setPrompts((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, answer: e.target.value } : p
                      )
                    )
                  }
                  placeholder="Write 10 to 200 characters..."
                  className="mt-1 w-full rounded border border-dusk/30 bg-fog px-3 py-2 font-serif text-sm leading-relaxed text-ink placeholder:font-sans placeholder:text-ink/50"
                />
                <p className="mt-1 text-xs text-ink/70">
                  {item.answer.trim().length}/200 characters (minimum 10)
                </p>
              </div>
            </div>
          ))}

          {prompts.length < 3 && (
            <button
              type="button"
              onClick={() => {
                const unusedKey =
                  PROMPT_KEYS.find(
                    (k) => !prompts.some((existing) => existing.key === k)
                  ) ?? PROMPT_KEYS[2];
                setPrompts((prev) => [...prev, { key: unusedKey, answer: "" }]);
              }}
              className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-4 text-xs font-medium text-dusk hover:bg-dusk/10"
            >
              Add a third prompt
            </button>
          )}

          <div className="border-t border-dusk/15 pt-3">
            <label
              htmlFor="prof-bio"
              className="block text-xs font-medium text-ink"
            >
              Short bio (optional)
            </label>
            <textarea
              id="prof-bio"
              rows={2}
              value={bioPrompt}
              onChange={(e) => setBioPrompt(e.target.value)}
              placeholder="What does an ideal low-pressure weekend look like for you?"
              className="mt-1 w-full rounded border border-dusk/30 bg-fog px-3 py-2 font-serif text-sm leading-relaxed text-ink placeholder:font-sans placeholder:text-ink/50"
            />
          </div>
        </fieldset>

        {/* Compatibility quiz questions */}
        <section className="space-y-4 rounded-lg border border-dusk/15 bg-dusk/5 p-5">
          <div>
            <h2 className="text-base font-semibold text-dusk">
              Compatibility quiz (5 questions)
            </h2>
            <p className="mt-0.5 text-xs text-ink/75">
              Adjust your 1–5 responses to recalculate compatibility scores for
              future matches.
            </p>
          </div>

          <div className="space-y-4">
            {QUIZ_QUESTIONS.map((q, index) => (
              <fieldset
                key={q.key}
                className="space-y-2 rounded border border-dusk/15 bg-fog p-4"
              >
                <legend className="text-sm font-semibold text-dusk">
                  {index + 1}. {q.title}
                </legend>
                <p className="text-xs text-ink/85">{q.prompt}</p>

                <div className="pt-1">
                  <label
                    htmlFor={`prof-slider-${q.key}`}
                    className="block text-xs font-medium text-ink/80"
                  >
                    Selected score: <strong>{answers[q.key]}</strong> / 5
                  </label>
                  <input
                    id={`prof-slider-${q.key}`}
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={answers[q.key]}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.key]: Number(e.target.value),
                      }))
                    }
                    className="mt-1.5 h-6 w-full cursor-pointer accent-teal"
                  />
                  <div className="flex justify-between text-xs text-ink/75">
                    <span>1 — {q.low}</span>
                    <span>5 — {q.high}</span>
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        {/* Full width 3: Optional divider + Interests */}
        <div className="space-y-4">
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-dusk/20" />
            <span className="mx-4 shrink-0 text-xs font-semibold uppercase tracking-wider text-dusk/80">
              Optional
            </span>
            <div className="flex-grow border-t border-dusk/20" />
          </div>

          <div className="space-y-2 rounded-lg border border-dusk/15 bg-dusk/5 p-5">
            <PillPicker
              mode="multi"
              label="Interests (max 6)"
              placeholder="Add interests"
              dialogTitle="Select your interests"
              dialogSubtitle="Choose up to 6 interests."
              options={INTEREST_OPTIONS}
              values={details.interests ?? []}
              maxSelections={6}
              onChange={(next) =>
                setDetails((prev) => ({ ...prev, interests: next }))
              }
            />
            <p className="text-xs text-ink/75">
              You can add more about you later in Edit profile.
            </p>
          </div>
        </div>

        {/* Consent block */}
        <div className="space-y-2 rounded-lg border border-teal/40 bg-teal/10 p-4">
          <h2 className="text-sm font-semibold text-dusk">
            Age verification and DPDP consent
          </h2>
          <label
            htmlFor="prof-over-18"
            className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink"
          >
            <input
              id="prof-over-18"
              type="checkbox"
              checked={isOver18Confirmed}
              onChange={(e) => setIsOver18Confirmed(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-teal"
            />
            <span>I confirm that I am 18 years of age or older.</span>
          </label>

          <label
            htmlFor="prof-dpdp-consent"
            className="flex min-h-[44px] cursor-pointer items-start gap-3 py-1 text-sm text-ink"
          >
            <input
              id="prof-dpdp-consent"
              type="checkbox"
              checked={dpdpConsent}
              onChange={(e) => setDpdpConsent(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-teal"
            />
            <span className="leading-relaxed">
              <strong>DPDP consent:</strong> I consent to pHavelength storing
              and processing my profile details, birth date, optional profile
              details (such as interests, languages, and lifestyle preferences),
              self-declared company or college, and quiz answers solely for
              generating curated matches and website chat. This consent is
              recorded with a timestamp and I can delete my account and all data
              at any time.
            </span>
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded border border-marigold bg-marigold/20 p-3 text-xs font-medium text-ink"
          >
            {error}
          </p>
        )}

        {/* Centered primary button */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] w-full max-w-xs rounded bg-dusk px-6 py-2.5 text-sm font-medium text-fog hover:bg-dusk/90 disabled:opacity-50"
          >
            {saving ? "Saving changes..." : "Save changes"}
          </button>
        </div>
      </form>

      {/* Edit profile only: "More about you" list under the form using PickerRow */}
      <section className="space-y-4 rounded-lg border border-dusk/20 bg-fog p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-dusk">More about you</h2>
            <p className="mt-0.5 text-xs text-ink/75">
              Optional details shown as chips on your profile. None of these
              fields affect matching or compatibility scoring.
            </p>
          </div>
          {detailsStatus && (
            <span
              role="status"
              className="rounded border border-teal/50 bg-teal/15 px-2.5 py-1 text-xs font-medium text-ink"
            >
              {detailsStatus}
            </span>
          )}
        </div>

        <div className="divide-y divide-dusk/15 rounded-lg border border-dusk/20 bg-fog">
          <PickerRow
            mode="single"
            label="Looking for"
            dialogTitle="What are you looking for?"
            options={RELATIONSHIP_GOAL_OPTIONS}
            value={relationshipGoal || null}
            onChange={(val) => {
              const nextGoal = (val as RelationshipGoal) ?? "";
              setRelationshipGoal(nextGoal);
              persistDetailsUpdate(details, nextGoal);
            }}
          />

          <PickerRow
            mode="single"
            label="Open to"
            dialogTitle="Open to"
            options={OPEN_TO_OPTIONS}
            value={details.open_to ?? null}
            onChange={(val) =>
              persistDetailsUpdate({ ...details, open_to: val })
            }
          />

          <PickerRow
            mode="multi"
            label="Languages"
            dialogTitle="Languages you speak"
            dialogSubtitle="Select up to 5 languages."
            options={LANGUAGE_OPTIONS}
            values={details.languages ?? []}
            maxSelections={5}
            onChange={(vals) =>
              persistDetailsUpdate({ ...details, languages: vals })
            }
          />

          <PickerRow
            mode="single"
            label="Zodiac"
            dialogTitle="Zodiac sign"
            options={ZODIAC_OPTIONS}
            value={details.zodiac ?? null}
            onChange={(val) =>
              persistDetailsUpdate({ ...details, zodiac: val })
            }
          />

          <PickerRow
            mode="single"
            label="Education"
            dialogTitle="Education"
            options={EDUCATION_OPTIONS}
            value={details.education ?? null}
            onChange={(val) =>
              persistDetailsUpdate({ ...details, education: val })
            }
          />

          <PickerRow
            mode="single"
            label="Communication style"
            dialogTitle="Communication style"
            options={COMMUNICATION_STYLE_OPTIONS}
            value={details.communication_style ?? null}
            onChange={(val) =>
              persistDetailsUpdate({ ...details, communication_style: val })
            }
          />

          <PickerRow
            mode="single"
            label="Love style"
            dialogTitle="Love style"
            options={LOVE_STYLE_OPTIONS}
            value={details.love_style ?? null}
            onChange={(val) =>
              persistDetailsUpdate({ ...details, love_style: val })
            }
          />

          <PickerRow
            mode="single"
            label="Pets"
            dialogTitle="Pets"
            options={PETS_OPTIONS}
            value={details.pets ?? null}
            onChange={(val) =>
              persistDetailsUpdate({ ...details, pets: val })
            }
          />

          <PickerRow
            mode="single"
            label="Drinking"
            dialogTitle="Drinking"
            options={DRINKING_OPTIONS}
            value={details.drinking ?? null}
            onChange={(val) =>
              persistDetailsUpdate({ ...details, drinking: val })
            }
          />

          <PickerRow
            mode="single"
            label="Smoking"
            dialogTitle="Smoking"
            options={SMOKING_OPTIONS}
            value={details.smoking ?? null}
            onChange={(val) =>
              persistDetailsUpdate({ ...details, smoking: val })
            }
          />

          <PickerRow
            mode="single"
            label="Workout"
            dialogTitle="Workout"
            options={WORKOUT_OPTIONS}
            value={details.workout ?? null}
            onChange={(val) =>
              persistDetailsUpdate({ ...details, workout: val })
            }
          />
        </div>
      </section>

      {/* Account & Delete account */}
      <div
        id="delete-account"
        className="space-y-3 rounded-lg border border-marigold/60 bg-marigold/10 p-6"
      >
        <h2 className="text-lg font-semibold text-dusk">
          Account and data removal
        </h2>
        <p className="text-xs leading-relaxed text-ink/85">
          Under DPDP rules, you can permanently delete your account, profile,
          matches, and messages at any time.
        </p>

        {deleteError && (
          <p
            role="alert"
            className="rounded border border-marigold bg-marigold/20 p-3 text-xs font-medium text-ink"
          >
            {deleteError}
          </p>
        )}

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex min-h-[44px] items-center rounded border border-dusk/30 bg-fog px-4 text-xs font-medium text-dusk hover:bg-marigold/25"
          >
            Delete account
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-ink">
              Permanently delete your account and all data?
            </span>
            <button
              type="button"
              disabled={deleting}
              onClick={onDeleteAccount}
              className="inline-flex min-h-[44px] items-center rounded bg-dusk px-3 text-xs font-medium text-fog disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Confirm delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="inline-flex min-h-[44px] items-center rounded border border-dusk/30 px-3 text-xs font-medium text-dusk"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
