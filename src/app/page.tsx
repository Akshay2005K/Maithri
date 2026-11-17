"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import AuthForm from "@/components/AuthForm";

interface BasicProfile {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  looking_for: string;
  city: string;
  dpdp_consent_at: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BasicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Minimal Phase 1 fields to test saving 1 row into `profiles`
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState(24);
  const [gender, setGender] = useState("M");
  const [lookingFor, setLookingFor] = useState("F");
  const [city, setCity] = useState("Bengaluru");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check current session from browser localStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) loadProfile(currentUser.id);
      else setLoading(false);
    });

    // 2. Listen for login / logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) loadProfile(currentUser.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, age, gender, looking_for, city, dpdp_consent_at")
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setFullName(data.full_name);
      setAge(data.age);
      setGender(data.gender);
      setLookingFor(data.looking_for);
      setCity(data.city);
    }
    setLoading(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setStatusMsg(null);

    const row = {
      id: user.id,
      full_name: fullName,
      age: Number(age),
      gender,
      looking_for: lookingFor,
      city,
      dpdp_consent_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(row)
      .select("id, full_name, age, gender, looking_for, city, dpdp_consent_at")
      .single();

    if (error) {
      setStatusMsg(`Error: ${error.message}`);
    } else {
      setProfile(data);
      setStatusMsg("Profile row saved to Supabase!");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <main className="p-8 text-center text-sm">Loading session...</main>;
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white">pHavelength</h1>
          <p className="text-xs text-slate-400">
            Phase 1: Supabase Auth + One Saved Profile Row
          </p>
        </div>
        {user && (
          <button
            onClick={handleSignOut}
            className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Sign Out
          </button>
        )}
      </header>

      {!user ? (
        <AuthForm />
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-xs text-slate-300">
            <p>
              <strong>Logged in as:</strong> {user.email}
            </p>
            <p className="mt-1 text-slate-400">
              <strong>Auth User ID:</strong> {user.id}
            </p>
          </div>

          <form
            onSubmit={handleSaveProfile}
            className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-5"
          >
            <h2 className="text-sm font-semibold text-white">
              Save Your Profile Row (`profiles` table)
            </h2>

            <div>
              <label className="block text-xs text-slate-300">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-300">
                  Age (18+)
                </label>
                <input
                  type="number"
                  min={18}
                  required
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white"
                >
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300">
                  Looking For
                </label>
                <select
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white"
                >
                  <option value="F">F</option>
                  <option value="M">M</option>
                  <option value="All">All</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white"
              />
            </div>

            {statusMsg && (
              <p className="text-xs text-emerald-400">{statusMsg}</p>
            )}

            <button
              type="submit"
              className="w-full rounded bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              Save Profile Row
            </button>
          </form>

          {profile && (
            <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 p-4 text-xs">
              <p className="font-semibold text-emerald-300">
                Saved Row in `profiles`:
              </p>
              <pre className="mt-2 overflow-x-auto text-slate-300">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
