"use client";

import { useEffect, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";
import { countWords, getUnblurStatus } from "@/lib/unblur";

interface MessageRow {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChatProps {
  currentUser: Profile;
  matchId: string;
  partner: Profile;
  compatibilityScore: number;
  onBack: () => void;
  onBlocked: () => void;
}

const REPORT_REASONS = [
  "Inappropriate or disrespectful messages",
  "Suspected fake or spam profile",
  "Harassment or safety concern",
  "Other / prefer not to match",
];

export default function Chat({
  currentUser,
  matchId,
  partner,
  compatibilityScore,
  onBack,
  onBlocked,
}: ChatProps) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showReportBox, setShowReportBox] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [blocking, setBlocking] = useState(false);

  async function fetchMessages() {
    const { data, error: fetchErr } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (fetchErr) {
      setError(fetchErr.message);
    } else if (data) {
      setMessages(data as MessageRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const unblur = getUnblurStatus(messages);
  const wordCount = countWords(draft);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (wordCount < 4) {
      setError(
        `Write at least 4 words to send a message (${wordCount}/4 words).`
      );
      return;
    }

    setSending(true);
    const { data, error: sendErr } = await supabase
      .from("messages")
      .insert({
        match_id: matchId,
        sender_id: currentUser.id,
        content: draft.trim(),
      })
      .select("*")
      .single();

    setSending(false);

    if (sendErr) {
      setError(sendErr.message);
      return;
    }

    setMessages((prev) => [...prev, data as MessageRow]);
    setDraft("");
  }

  async function handleReportAndBlock() {
    setError(null);
    setBlocking(true);

    const { error: blockErr } = await supabase.from("reports_blocks").insert({
      reporter_id: currentUser.id,
      reported_id: partner.id,
      reason: reportReason,
    });

    setBlocking(false);

    if (blockErr) {
      setError(blockErr.message);
      return;
    }

    onBlocked();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
        >
          &larr; Back to Today&apos;s Matches
        </button>

        <button
          type="button"
          onClick={() => setShowReportBox(!showReportBox)}
          className="rounded border border-red-800/70 bg-red-950/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/60"
        >
          Report / Block
        </button>
      </div>

      {showReportBox && (
        <div className="space-y-3 rounded-lg border border-red-800/70 bg-red-950/30 p-4 text-xs">
          <p className="font-semibold text-red-200">
            Report &amp; Block {partner.full_name}
          </p>
          <p className="text-slate-300">
            Blocking immediately removes this match and hides this person from
            your future matches.
          </p>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={blocking}
              onClick={handleReportAndBlock}
              className="rounded bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              {blocking ? "Blocking..." : "Confirm Report & Block"}
            </button>
            <button
              type="button"
              onClick={() => setShowReportBox(false)}
              className="rounded border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Partner Summary & Progressive Unblur Bar */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
            <img
              src={partner.avatar_url || "/avatars/avatar-1.svg"}
              alt={`${partner.full_name} placeholder avatar`}
              className={`h-full w-full object-cover transition-all duration-500 ${unblur.blurClass}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-white">
                {partner.full_name}, {partner.age}
              </h2>
              <span className="rounded-full border border-emerald-800/60 bg-emerald-950 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                {compatibilityScore}% Match
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {partner.role_title || "Grad"} • {partner.city} • Batch{" "}
              {partner.batch}
            </p>
            <p className="mt-1 text-[11px] text-amber-300/90">
              Simulated eLitmus verification (prototype)
            </p>
          </div>
        </div>

        <div className="mt-4 rounded border border-slate-800 bg-slate-950 p-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-violet-300">{unblur.label}</span>
            <span className="shrink-0 text-slate-400">
              {Math.min(unblur.validCount, 3)}/3 msgs
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <div
              className={`h-1.5 rounded ${
                unblur.level >= 1 ? "bg-violet-500" : "bg-slate-800"
              }`}
            />
            <div
              className={`h-1.5 rounded ${
                unblur.level >= 2 ? "bg-violet-500" : "bg-slate-800"
              }`}
            />
            <div
              className={`h-1.5 rounded ${
                unblur.level >= 3 ? "bg-emerald-500" : "bg-slate-800"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Chat Thread */}
      <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-semibold text-slate-300">
            Chat (4+ words per message required)
          </span>
          <button
            type="button"
            onClick={fetchMessages}
            className="text-[11px] text-violet-400 hover:underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-xs text-slate-400">
            Loading messages...
          </p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            No messages yet. Write a thoughtful 4+ word opener about their
            prompt!
          </p>
        ) : (
          <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                      isMine
                        ? "bg-violet-600 text-white"
                        : "bg-slate-800 text-slate-100"
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-2 pt-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write at least 4 words..."
              className="flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              Word count:{" "}
              <strong
                className={wordCount >= 4 ? "text-emerald-400" : "text-amber-300"}
              >
                {wordCount}/4 minimum
              </strong>
            </span>
            <span>
              Tip: open the other demo account in an incognito window to test
              replies.
            </span>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>
      </div>
    </div>
  );
}
