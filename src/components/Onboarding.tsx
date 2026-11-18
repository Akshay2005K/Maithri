"use client";

import { useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";

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
  const [dpdpConsent, setDpdpConsent] = useState(
    Boolean(existingProfile?.dpdp_consent_at)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Hard 18+ age gate on the client (also enforced in Postgres via CHECK (age >= 18))
    if (!isOver18Confirmed || Number(age) < 18) {
      setError("You must be 18 or older to use pHavelength.");
      return;
    }

    // Explicit DPDP consent gate
    if (!dpdpConsent) {
      setError("Please review and accept the DPDP data consent to continue.");
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
      setError(dbError.message);
      return;
    }

    onComplete(data as Profile);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg border border-slate-800 bg-slate-900 p-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-white">
          Complete Your Profile
        </h2>
        <p className="mt-1 text-xs text-amber-300/90">
          Simulated eLitmus verification (prototype — designed to plug into
          eLitmus data)
        </p>
      </div>

      {/* Placeholder Avatar Picker (no real people's photos) */}
      <div>
        <label className="block text-xs font-medium text-slate-300">
          Choose an Illustration Avatar (prototype placeholder)
        </label>
        <div className="mt-2 flex flex-wrap gap-3">
          {AVATAR_OPTIONS.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => setAvatarUrl(url)}
              className={`rounded-xl border-2 p-0.5 transition ${
                avatarUrl === url
                  ? "border-violet-500 bg-violet-500/20"
                  : "border-slate-700 opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={url}
                alt="Illustration avatar"
                className="h-12 w-12 rounded-lg"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Basic Details */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-slate-300">Full Name *</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Aarav Sharma"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-300">Age (18+) *</label>
          <input
            type="number"
            required
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-300">Gender *</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="M">M</option>
            <option value="F">F</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-300">Looking For *</label>
          <select
            value={lookingFor}
            onChange={(e) => setLookingFor(e.target.value)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="F">F</option>
            <option value="M">M</option>
            <option value="All">All</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-300">City *</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
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

      {/* Simulated eLitmus Career & Batch Section */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-slate-300">
            eLitmus Batch (Simulated)
          </label>
          <select
            value={batch}
            onChange={(e) => setBatch(Number(e.target.value))}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value={2020}>2020</option>
            <option value={2021}>2021</option>
            <option value={2022}>2022</option>
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-300">Role Title</label>
          <input
            type="text"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="e.g. Software Engineer"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-slate-300">
            Company Domain (self-declared, prototype)
          </label>
          <input
            type="text"
            value={companyDomain}
            onChange={(e) => setCompanyDomain(e.target.value)}
            placeholder="e.g. flipkart.com"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-300">College Name</label>
          <input
            type="text"
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
            placeholder="e.g. NIT Trichy"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-300">
          Short Bio / Sunday Prompt
        </label>
        <textarea
          rows={2}
          value={bioPrompt}
          onChange={(e) => setBioPrompt(e.target.value)}
          placeholder="What does an ideal low-pressure weekend look like for you?"
          className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        />
      </div>

      {/* Privacy Shield Settings */}
      <div className="space-y-2 rounded border border-slate-800 bg-slate-950 p-3">
        <p className="text-xs font-semibold text-violet-300">
          Privacy Shield Settings
        </p>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={hideSameCompany}
            onChange={(e) => setHideSameCompany(e.target.checked)}
            className="rounded border-slate-600"
          />
          Hide profiles with my company domain (avoid matching coworkers)
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={hideSameCollege}
            onChange={(e) => setHideSameCollege(e.target.checked)}
            className="rounded border-slate-600"
          />
          Hide profiles from my college
        </label>
      </div>

      {/* 18+ Age Gate & DPDP Consent */}
      <div className="space-y-2 rounded border border-slate-800 bg-slate-950 p-3">
        <p className="text-xs font-semibold text-emerald-300">
          Age Verification &amp; DPDP Consent
        </p>
        <label className="flex items-start gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={isOver18Confirmed}
            onChange={(e) => setIsOver18Confirmed(e.target.checked)}
            className="mt-0.5 rounded border-slate-600"
          />
          <span>I confirm that I am 18 years of age or older.</span>
        </label>

        <label className="flex items-start gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={dpdpConsent}
            onChange={(e) => setDpdpConsent(e.target.checked)}
            className="mt-0.5 rounded border-slate-600"
          />
          <span>
            <strong>DPDP Consent:</strong> I consent to pHavelength storing and
            processing my profile details, self-declared company/college, and
            quiz answers solely for generating curated matches and in-app chat.
            This consent is recorded with a timestamp and I can delete my
            account and all data at any time.
          </span>
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Profile & Continue"}
      </button>
    </form>
  );
}
