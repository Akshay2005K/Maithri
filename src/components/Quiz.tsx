"use client";

import { useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";

const QUESTIONS = [
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
      setError(`${dbError.message} Please try saving your answers again.`);
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
            Compatibility quiz
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/85">
            Rate each topic from 1 to 5. Daily compatibility is calculated from
            how close your answers are across these five areas.
          </p>
        </div>

        <div className="space-y-5">
          {QUESTIONS.map((q) => (
            <fieldset
              key={q.key}
              className="rounded-lg border border-dusk/15 bg-dusk/5 p-4 sm:p-5"
            >
              <legend className="text-base font-semibold text-dusk">
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

              <div className="mt-2.5 flex justify-between gap-4 text-xs text-ink/75">
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
          {saving ? "Saving answers..." : "Save compatibility answers"}
        </button>
      </form>
    </section>
  );
}
