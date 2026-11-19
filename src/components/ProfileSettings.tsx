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
  onSaved: (updated: Profile) => void;
  onCancel: () => void;
  onDeleteAccount: () => Promise<void>;
  deleting: boolean;
  deleteError: string | null;
}

export default function ProfileSettings({
  profile,
  onSaved,
  onCancel,
  onDeleteAccount,
  deleting,
  deleteError,
}: ProfileSettingsProps) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState(profile.gender);
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
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSaveAll(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (Number(age) < 18) {
      setError("You must be 18 or older to use pHavelength.");
      return;
    }

    if (!relationshipGoal) {
      setError("Select your relationship goal before saving.");
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
    <section className="mx-auto w-full max-w-[640px] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dusk/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-dusk">Profile settings</h1>
          <p className="mt-1 text-xs text-ink/75">
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

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Segment 1: Profile & Details */}
        <div className="space-y-5 rounded-lg border border-dusk/20 bg-fog p-6">
          <h2 className="text-lg font-semibold text-dusk">
            Profile and details
          </h2>

          <fieldset>
            <legend className="text-sm font-medium text-ink">
              Illustration avatar (prototype placeholder)
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="prof-full-name"
                className="block text-sm font-medium text-ink"
              >
                Full name
              </label>
              <input
                id="prof-full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="prof-age"
                className="block text-sm font-medium text-ink"
              >
                Age (18+)
              </label>
              <input
                id="prof-age"
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
                htmlFor="prof-gender"
                className="block text-sm font-medium text-ink"
              >
                Gender
              </label>
              <select
                id="prof-gender"
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
                htmlFor="prof-looking-for"
                className="block text-sm font-medium text-ink"
              >
                Looking for
              </label>
              <select
                id="prof-looking-for"
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
          </div>

          <fieldset className="space-y-2.5">
            <legend className="text-sm font-medium text-ink">
              What are you looking for?
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {RELATIONSHIP_GOALS.map((goal) => (
                <label
                  key={goal.key}
                  htmlFor={`prof-goal-${goal.key}`}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded border px-3 py-2 text-sm ${
                    relationshipGoal === goal.key
                      ? "border-dusk bg-dusk font-medium text-fog"
                      : "border-dusk/25 bg-fog text-ink hover:bg-dusk/5"
                  }`}
                >
                  <input
                    id={`prof-goal-${goal.key}`}
                    type="radio"
                    name="prof_relationship_goal"
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="prof-batch"
                className="block text-sm font-medium text-ink"
              >
                eLitmus batch (simulated)
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
                Role title
              </label>
              <input
                id="prof-role"
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="prof-company"
                className="block text-sm font-medium text-ink"
              >
                Company domain (self-declared, prototype)
              </label>
              <input
                id="prof-company"
                type="text"
                value={companyDomain}
                onChange={(e) => setCompanyDomain(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="prof-college"
                className="block text-sm font-medium text-ink"
              >
                College name
              </label>
              <input
                id="prof-college"
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="prof-bio"
              className="block text-sm font-medium text-ink"
            >
              Short bio / weekend prompt
            </label>
            <textarea
              id="prof-bio"
              rows={3}
              value={bioPrompt}
              onChange={(e) => setBioPrompt(e.target.value)}
              className="mt-1.5 w-full rounded border border-dusk/30 bg-fog px-3 py-2.5 font-serif text-sm leading-relaxed text-ink"
            />
          </div>

          {/* Privacy Shield */}
          <div className="space-y-2 rounded-lg border border-dusk/15 bg-dusk/5 p-4">
            <h3 className="text-sm font-semibold text-dusk">
              Privacy Shield settings
            </h3>
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
          </div>
        </div>

        {/* Segment 2: Profile Prompts */}
        <div className="space-y-4 rounded-lg border border-dusk/20 bg-fog p-6">
          <div>
            <h2 className="text-lg font-semibold text-dusk">Profile prompts</h2>
            <p className="mt-1 text-xs text-ink/75">
              Keep 2 to 3 prompts answered (10 to 200 characters each).
            </p>
          </div>

          {prompts.map((item, idx) => (
            <div
              key={idx}
              className="space-y-2 rounded border border-dusk/15 bg-dusk/5 p-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor={`prof-prompt-key-${idx}`}
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
                  className="mt-1 w-full rounded border border-dusk/30 bg-fog px-3 py-2 font-serif text-sm leading-relaxed text-ink"
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
        </div>

        {/* Segment 3: Compatibility Quiz */}
        <div className="space-y-4 rounded-lg border border-dusk/20 bg-fog p-6">
          <div>
            <h2 className="text-lg font-semibold text-dusk">
              Compatibility quiz
            </h2>
            <p className="mt-1 text-xs text-ink/75">
              Adjust any rating from 1 to 5. Future daily matches use your
              updated answers.
            </p>
          </div>

          {QUIZ_QUESTIONS.map((q) => (
            <fieldset
              key={q.key}
              className="rounded-lg border border-dusk/15 bg-dusk/5 p-4"
            >
              <legend className="text-sm font-semibold text-dusk">
                {q.title}
              </legend>
              <p className="mt-1 font-serif text-sm text-ink/90">{q.prompt}</p>

              <div className="mt-3 flex items-center justify-between gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    aria-label={`${q.title}: rate ${num} out of 5`}
                    aria-pressed={answers[q.key] === num}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [q.key]: num }))
                    }
                    className={`min-h-[44px] flex-1 rounded border text-sm font-semibold ${
                      answers[q.key] === num
                        ? "border-dusk bg-dusk text-fog"
                        : "border-dusk/25 bg-fog text-ink hover:bg-teal/15"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex justify-between gap-4 text-xs text-ink/75">
                <span>{q.low}</span>
                <span className="text-right">{q.high}</span>
              </div>
            </fieldset>
          ))}
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
          {saving ? "Saving changes..." : "Save changes"}
        </button>
      </form>

      {/* Segment 4: Account & Delete Account */}
      <div className="rounded-lg border border-dusk/20 bg-fog p-6">
        <h2 className="text-lg font-semibold text-dusk">Account</h2>
        {!confirmDelete ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/80">
            <span>
              Permanently erase your account, profile, matches, and messages.
            </span>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex min-h-[44px] items-center rounded border border-marigold bg-marigold/20 px-4 text-sm font-medium text-ink hover:bg-marigold/30"
            >
              Delete account
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3 rounded-lg border border-marigold bg-marigold/15 p-4 text-sm text-ink">
            <p className="font-semibold text-dusk">
              Confirm permanent account deletion
            </p>
            <p className="text-ink/90">
              This deletes your Supabase Auth user and removes your profile,
              matches, messages, and reports. If you are testing with a seeded
              demo account, create a fresh signup instead so demo accounts stay
              intact.
            </p>
            {deleteError && (
              <p className="font-medium text-dusk">{deleteError}</p>
            )}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                disabled={deleting}
                onClick={onDeleteAccount}
                className="inline-flex min-h-[44px] items-center rounded bg-dusk px-4 text-sm font-medium text-fog disabled:opacity-50"
              >
                {deleting ? "Deleting account..." : "Delete permanently"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-4 text-sm font-medium text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
