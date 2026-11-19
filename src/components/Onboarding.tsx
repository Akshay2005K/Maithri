"use client";

import { useState } from "react";
import {
  supabase,
  RELATIONSHIP_GOALS,
  PROMPT_KEYS,
  type Profile,
  type ProfilePrompt,
  type RelationshipGoal,
} from "@/lib/supabase";

const AVATAR_OPTIONS = [
  "/avatars/avatar-1.svg",
  "/avatars/avatar-2.svg",
  "/avatars/avatar-3.svg",
  "/avatars/avatar-4.svg",
  "/avatars/avatar-5.svg",
  "/avatars/avatar-6.svg",
];

interface OnboardingProps {
  userId: string;
  existingProfile: Profile | null;
  onComplete: (savedProfile: Profile) => void;
}

export default function Onboarding({
  userId,
  existingProfile,
  onComplete,
}: OnboardingProps) {
  const [fullName, setFullName] = useState(existingProfile?.full_name ?? "");
  const [age, setAge] = useState(existingProfile?.age ?? 24);
  const [isOver18Confirmed, setIsOver18Confirmed] = useState(
    Boolean(existingProfile && existingProfile.age >= 18)
  );
  const [gender, setGender] = useState(existingProfile?.gender ?? "M");
  const [lookingFor, setLookingFor] = useState(
    existingProfile?.looking_for ?? "F"
  );
  const [city, setCity] = useState(existingProfile?.city ?? "Bengaluru");
  const [roleTitle, setRoleTitle] = useState(
    existingProfile?.role_title ?? ""
  );
  const [companyDomain, setCompanyDomain] = useState(
    existingProfile?.company_domain ?? ""
  );
  const [collegeName, setCollegeName] = useState(
    existingProfile?.college_name ?? ""
  );
  const [batch, setBatch] = useState(existingProfile?.batch ?? 2022);
  const [hideSameCompany, setHideSameCompany] = useState(
    existingProfile?.hide_same_company ?? true
  );
  const [hideSameCollege, setHideSameCollege] = useState(
    existingProfile?.hide_same_college ?? false
  );
  const [bioPrompt, setBioPrompt] = useState(
    existingProfile?.bio_prompt ?? ""
  );
  const [avatarUrl, setAvatarUrl] = useState(
    existingProfile?.avatar_url ?? AVATAR_OPTIONS[0]
  );
  const [relationshipGoal, setRelationshipGoal] = useState<
    RelationshipGoal | ""
  >(existingProfile?.relationship_goal ?? "");
  const [prompts, setPrompts] = useState<ProfilePrompt[]>(() => {
    const existing = Array.isArray(existingProfile?.prompts)
      ? existingProfile.prompts
      : [];
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
  const [dpdpConsent, setDpdpConsent] = useState(
    Boolean(existingProfile?.dpdp_consent_at)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Required relationship goal
    if (!relationshipGoal) {
      setError(
        "Select your relationship goal above before saving your profile."
      );
      return;
    }

    // Validate 2 to 3 profile prompts (10-200 characters, unique keys)
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

    // Hard 18+ age gate on the client (also enforced in Postgres via CHECK (age >= 18))
    if (!isOver18Confirmed || Number(age) < 18) {
      setError(
        "You must be 18 or older to use pHavelength. Enter an age of 18 or above and check the age confirmation box."
      );
      return;
    }

    // Explicit DPDP consent gate
    if (!dpdpConsent) {
      setError(
        "Please check the DPDP consent box above to allow saving your profile."
      );
      return;
    }

    setSaving(true);

    const row = {
      id: userId,
      full_name: fullName.trim(),
      age: Number(age),
      gender,
      looking_for: lookingFor,
      city: city.trim(),
      role_title: roleTitle.trim() || null,
      company_domain: companyDomain.trim().toLowerCase() || null,
      college_name: collegeName.trim() || null,
      batch: Number(batch),
      hide_same_company: hideSameCompany,
      hide_same_college: hideSameCollege,
      bio_prompt: bioPrompt.trim() || null,
      avatar_url: avatarUrl,
      relationship_goal: relationshipGoal,
      prompts: cleanedPrompts,
      dpdp_consent_at:
        existingProfile?.dpdp_consent_at ?? new Date().toISOString(),
    };

    const { data, error: dbError } = await supabase
      .from("profiles")
      .upsert(row)
      .select()
      .single();

    setSaving(false);

    if (dbError) {
      setError(
        `${dbError.message} Check the highlighted fields and try saving again.`
      );
      return;
    }

    onComplete(data as Profile);
  }

  return (
    <section className="mx-auto w-full max-w-[640px]">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-dusk/20 bg-fog p-6 sm:p-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-dusk">
            Complete your profile
          </h1>
          <p className="mt-2 inline-block rounded border border-marigold bg-marigold/20 px-2.5 py-1 text-xs font-medium text-ink">
            Simulated eLitmus verification (prototype — designed to plug into
            eLitmus data)
          </p>
        </div>

        {/* Placeholder Avatar Picker (no real people's photos) */}
        <fieldset>
          <legend className="text-sm font-medium text-ink">
            Choose an illustration avatar (prototype placeholder)
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-3">
            {AVATAR_OPTIONS.map((url, idx) => (
              <button
                key={url}
                type="button"
                aria-label={`Select illustration avatar ${idx + 1}`}
                aria-pressed={avatarUrl === url}
                onClick={() => setAvatarUrl(url)}
                className={`min-h-[44px] min-w-[44px] rounded-xl border-2 p-1 ${
                  avatarUrl === url
                    ? "border-teal bg-teal/15"
                    : "border-dusk/20 bg-fog opacity-80"
                }`}
              >
                <img
                  src={url}
                  alt={`Illustration avatar ${idx + 1}`}
                  className="h-12 w-12 rounded-lg"
                />
              </button>
            ))}
          </div>
        </fieldset>

        {/* Basic Details */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="onb-full-name"
              className="block text-sm font-medium text-ink"
            >
              Full name
            </label>
            <input
              id="onb-full-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink placeholder:text-ink/50"
            />
          </div>

          <div>
            <label
              htmlFor="onb-age"
              className="block text-sm font-medium text-ink"
            >
              Age (18+)
            </label>
            <input
              id="onb-age"
              type="number"
              required
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="onb-gender"
              className="block text-sm font-medium text-ink"
            >
              Gender
            </label>
            <select
              id="onb-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
            >
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="onb-looking-for"
              className="block text-sm font-medium text-ink"
            >
              Looking for
            </label>
            <select
              id="onb-looking-for"
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
            >
              <option value="F">F</option>
              <option value="M">M</option>
              <option value="All">All</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="onb-city"
              className="block text-sm font-medium text-ink"
            >
              City
            </label>
            <select
              id="onb-city"
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
        </div>

        {/* Relationship Goal (Required single-choice) */}
        <fieldset className="space-y-2.5">
          <legend className="text-sm font-medium text-ink">
            What are you looking for?
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RELATIONSHIP_GOALS.map((goal) => (
              <label
                key={goal.key}
                htmlFor={`onb-goal-${goal.key}`}
                className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded border px-3 py-2 text-sm ${
                  relationshipGoal === goal.key
                    ? "border-dusk bg-dusk text-fog font-medium"
                    : "border-dusk/25 bg-fog text-ink hover:bg-dusk/5"
                }`}
              >
                <input
                  id={`onb-goal-${goal.key}`}
                  type="radio"
                  name="relationship_goal"
                  value={goal.key}
                  checked={relationshipGoal === goal.key}
                  onChange={() => setRelationshipGoal(goal.key)}
                  className="h-4 w-4 shrink-0 accent-teal"
                />
                <span>{goal.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Simulated eLitmus Career & Batch Section */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="onb-batch"
              className="block text-sm font-medium text-ink"
            >
              eLitmus batch (simulated)
            </label>
            <select
              id="onb-batch"
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
              htmlFor="onb-role"
              className="block text-sm font-medium text-ink"
            >
              Role title
            </label>
            <input
              id="onb-role"
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
              htmlFor="onb-company-domain"
              className="block text-sm font-medium text-ink"
            >
              Company domain (self-declared, prototype)
            </label>
            <input
              id="onb-company-domain"
              type="text"
              value={companyDomain}
              onChange={(e) => setCompanyDomain(e.target.value)}
              placeholder="e.g. flipkart.com"
              className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink placeholder:text-ink/50"
            />
          </div>

          <div>
            <label
              htmlFor="onb-college"
              className="block text-sm font-medium text-ink"
            >
              College name
            </label>
            <input
              id="onb-college"
              type="text"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              placeholder="e.g. NIT Trichy"
              className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink placeholder:text-ink/50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="onb-bio"
            className="block text-sm font-medium text-ink"
          >
            Short bio / weekend prompt
          </label>
          <textarea
            id="onb-bio"
            rows={3}
            value={bioPrompt}
            onChange={(e) => setBioPrompt(e.target.value)}
            placeholder="What does an ideal low-pressure weekend look like for you?"
            className="mt-1.5 w-full rounded border border-dusk/30 bg-fog px-3 py-2.5 font-serif text-sm leading-relaxed text-ink placeholder:font-sans placeholder:text-ink/50"
          />
        </div>

        {/* Profile Prompts (2 required, up to 3, 10-200 chars each) */}
        <fieldset className="space-y-4 rounded-lg border border-dusk/15 bg-dusk/5 p-4">
          <div>
            <legend className="text-sm font-semibold text-dusk">
              Profile prompts (at least 2 required, up to 3)
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
                  htmlFor={`onb-prompt-key-${idx}`}
                  className="text-xs font-medium text-ink"
                >
                  Prompt topic
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
                id={`onb-prompt-key-${idx}`}
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
                  htmlFor={`onb-prompt-answer-${idx}`}
                  className="block text-xs font-medium text-ink"
                >
                  Your answer
                </label>
                <textarea
                  id={`onb-prompt-answer-${idx}`}
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
        </fieldset>

        {/* Privacy Shield Settings */}
        <div className="space-y-2 rounded-lg border border-dusk/15 bg-dusk/5 p-4">
          <h2 className="text-sm font-semibold text-dusk">
            Privacy Shield settings
          </h2>
          <label
            htmlFor="onb-hide-company"
            className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink"
          >
            <input
              id="onb-hide-company"
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
            htmlFor="onb-hide-college"
            className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink"
          >
            <input
              id="onb-hide-college"
              type="checkbox"
              checked={hideSameCollege}
              onChange={(e) => setHideSameCollege(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-teal"
            />
            <span>Hide profiles from my college</span>
          </label>
        </div>

        {/* 18+ Age Gate & DPDP Consent */}
        <div className="space-y-2 rounded-lg border border-teal/40 bg-teal/10 p-4">
          <h2 className="text-sm font-semibold text-dusk">
            Age verification and DPDP consent
          </h2>
          <label
            htmlFor="onb-over-18"
            className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink"
          >
            <input
              id="onb-over-18"
              type="checkbox"
              checked={isOver18Confirmed}
              onChange={(e) => setIsOver18Confirmed(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-teal"
            />
            <span>I confirm that I am 18 years of age or older.</span>
          </label>

          <label
            htmlFor="onb-dpdp-consent"
            className="flex min-h-[44px] cursor-pointer items-start gap-3 py-1 text-sm text-ink"
          >
            <input
              id="onb-dpdp-consent"
              type="checkbox"
              checked={dpdpConsent}
              onChange={(e) => setDpdpConsent(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-teal"
            />
            <span className="leading-relaxed">
              <strong>DPDP consent:</strong> I consent to pHavelength storing
              and processing my profile details, self-declared company or
              college, and quiz answers solely for generating curated matches
              and website chat. This consent is recorded with a timestamp and I
              can delete my account and all data at any time.
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

        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] w-full rounded bg-dusk px-4 py-2.5 text-sm font-medium text-fog hover:bg-dusk/90 disabled:opacity-50"
        >
          {saving ? "Saving profile..." : "Save profile and continue"}
        </button>
      </form>
    </section>
  );
}
