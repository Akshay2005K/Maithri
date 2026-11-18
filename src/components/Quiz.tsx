"use client";

import { useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";

const QUESTIONS = [
  {
    key: "q1" as const,
    title: "1. Work-Life Rhythm",
    prompt: "How do you balance career ambition vs personal downtime?",
    low: "1 — Strict 9-to-6 boundaries",
    high: "5 — High-growth startup hustle",
  },
  {
    key: "q2" as const,
    title: "2. Weekend Social Battery",
    prompt: "How do you prefer to recharge on Saturday and Sunday?",
    low: "1 — Quiet reading, rest & home cooking",
    high: "5 — Outings, events & social plans",
  },
  {
    key: "q3" as const,
    title: "3. Financial Style",
    prompt: "How do you approach spending vs saving in your 20s?",
    low: "1 — Spend freely on experiences now",
    high: "5 — Disciplined saving & SIPs first",
  },
  {
    key: "q4" as const,
    title: "4. Conflict Resolution",
    prompt: "When a disagreement happens, what feels healthiest to you?",
    low: "1 — Take quiet space before talking",
    high: "5 — Discuss directly right away",
  },
  {
    key: "q5" as const,
    title: "5. City & Future Flexibility",
    prompt: "How open are you to relocating cities over the next 3–5 years?",
    low: "1 — Want to stay settled in my city",
    high: "5 — Open to moving cities / abroad",
  },
];

interface QuizProps {
  profile: Profile;
  onComplete: (updatedProfile: Profile) => void;
}

export default function Quiz({ profile, onComplete }: QuizProps) {
  const [answers, setAnswers] = useState({
    q1: profile.q1 ?? 3,
    q2: profile.q2 ?? 3,
    q3: profile.q3 ?? 3,
    q4: profile.q4 ?? 3,
    q5: profile.q5 ?? 3,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { data, error: dbError } = await supabase
      .from("profiles")
      .update(answers)
      .eq("id", profile.id)
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
          5-Question Compatibility Quiz
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Rate each statement from 1 to 5. We compute your daily compatibility
          score from the difference across these five answers.
        </p>
      </div>

      <div className="space-y-4">
        {QUESTIONS.map((q) => (
          <div
            key={q.key}
            className="rounded border border-slate-800 bg-slate-950 p-4"
          >
            <p className="text-sm font-medium text-white">{q.title}</p>
            <p className="mt-0.5 text-xs text-slate-300">{q.prompt}</p>

            <div className="mt-3 flex items-center justify-between gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [q.key]: num }))
                  }
                  className={`flex-1 rounded border py-1.5 text-sm font-medium transition ${
                    answers[q.key] === num
                      ? "border-violet-500 bg-violet-600 text-white"
                      : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="mt-2 flex justify-between text-[11px] text-slate-400">
              <span>{q.low}</span>
              <span>{q.high}</span>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {saving ? "Saving Quiz..." : "Save Compatibility Answers"}
      </button>
    </form>
  );
}
