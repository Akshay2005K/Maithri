"use client";

import { useEffect, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";
import { countWords, getUnblurStatus } from "@/lib/unblur";
import WavePair from "@/components/WavePair";

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
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  async function fetchMessages() {
    const { data, error: fetchErr } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (fetchErr) {
      setError(`${fetchErr.message} Click Refresh messages to try again.`);
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
        `Write at least 4 words so your message goes beyond a one-word opener (currently ${wordCount}/4 words).`
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
      setError(`${sendErr.message} Check your message and try sending again.`);
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
      setError(`${blockErr.message} Please try blocking again.`);
      return;
    }

    onBlocked();
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dusk/15 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-dusk">
            Conversation with {partner.full_name}
          </h1>
          <p className="mt-0.5 text-sm text-ink/75">
            Four or more words per message unlock photos over three exchanges.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-4 text-sm font-medium text-dusk hover:bg-dusk/10"
        >
          Back to matches
        </button>
      </div>

      {/* Desktop: 2 columns (conversation left, partner panel right). Mobile: partner panel collapsed above messages */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Partner Panel (Right on desktop, collapsed above messages on mobile) */}
        <aside className="order-1 rounded-lg border border-dusk/20 bg-fog p-4 lg:order-2 lg:col-span-5 lg:p-5">
          {/* Mobile collapsed summary bar */}
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-dusk/20 bg-dusk/10">
                <img
                  src={partner.avatar_url || "/avatars/avatar-1.svg"}
                  alt={`${partner.full_name} placeholder avatar`}
                  className={`h-full w-full object-cover transition-[filter] duration-1000 ease-out ${unblur.blurClass}`}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-dusk">
                  {partner.full_name}, {partner.age}
                </p>
                <p className="truncate text-xs text-ink/75">{unblur.label}</p>
              </div>
            </div>
            <button
              type="button"
              aria-expanded={mobilePanelOpen}
              aria-controls="chat-partner-details"
              onClick={() => setMobilePanelOpen((prev) => !prev)}
              className="inline-flex min-h-[44px] shrink-0 items-center rounded border border-dusk/25 px-3 text-xs font-medium text-dusk"
            >
              {mobilePanelOpen ? "Hide details" : "Partner details"}
            </button>
          </div>

          {/* Full partner details (always shown on lg+, toggled on mobile) */}
          <div
            id="chat-partner-details"
            className={`${
              mobilePanelOpen ? "mt-4 block border-t border-dusk/15 pt-4" : "hidden"
            } space-y-5 lg:mt-0 lg:block lg:border-t-0 lg:pt-0`}
          >
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-dusk/25 bg-dusk/10">
                <img
                  src={partner.avatar_url || "/avatars/avatar-1.svg"}
                  alt={`${partner.full_name} placeholder avatar`}
                  className={`h-full w-full object-cover transition-[filter] duration-1000 ease-out ${unblur.blurClass}`}
                />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="text-lg font-semibold text-dusk">
                  {partner.full_name}, {partner.age}
                </h2>
                <p className="text-sm text-ink/80">
                  {partner.role_title || "Graduate"} • {partner.city} • Batch{" "}
                  {partner.batch}
                </p>
                <p className="inline-block rounded border border-marigold bg-marigold/20 px-2 py-0.5 text-xs font-medium text-ink">
                  Simulated eLitmus verification (prototype)
                </p>
              </div>
            </div>

            {partner.bio_prompt && (
              <p className="font-serif text-sm leading-relaxed text-ink/90">
                &ldquo;{partner.bio_prompt}&rdquo;
              </p>
            )}

            <div className="border-y border-dusk/15 py-3">
              <WavePair score={compatibilityScore} />
            </div>

            {/* Unblur status */}
            <div className="space-y-2 rounded border border-dusk/15 bg-dusk/5 p-3.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-dusk">{unblur.label}</span>
                <span className="shrink-0 text-ink/75">
                  {Math.min(unblur.validCount, 3)}/3 messages
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div
                  className={`h-2 rounded ${
                    unblur.level >= 1 ? "bg-teal" : "bg-dusk/15"
                  }`}
                />
                <div
                  className={`h-2 rounded ${
                    unblur.level >= 2 ? "bg-teal" : "bg-dusk/15"
                  }`}
                />
                <div
                  className={`h-2 rounded ${
                    unblur.level >= 3 ? "bg-marigold" : "bg-dusk/15"
                  }`}
                />
              </div>
            </div>

            {/* Report / Block */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => setShowReportBox(!showReportBox)}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded border border-dusk/25 bg-fog px-4 text-sm font-medium text-dusk hover:bg-marigold/20"
              >
                {showReportBox ? "Close report options" : "Report and block"}
              </button>

              {showReportBox && (
                <div className="space-y-3 rounded-lg border border-marigold bg-marigold/15 p-4 text-xs text-ink">
                  <p className="text-sm font-semibold text-dusk">
                    Report and block {partner.full_name}
                  </p>
                  <p className="leading-relaxed text-ink/85">
                    Blocking immediately removes this match and hides this
                    person from your future matches.
                  </p>
                  <div>
                    <label
                      htmlFor="chat-report-reason"
                      className="block text-xs font-medium text-ink"
                    >
                      Reason
                    </label>
                    <select
                      id="chat-report-reason"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="mt-1 min-h-[44px] w-full rounded border border-dusk/30 bg-fog px-3 py-2 text-xs text-ink"
                    >
                      {REPORT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={blocking}
                      onClick={handleReportAndBlock}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded bg-dusk px-3 text-xs font-medium text-fog disabled:opacity-50"
                    >
                      {blocking ? "Blocking..." : "Confirm report and block"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReportBox(false)}
                      className="inline-flex min-h-[44px] items-center rounded border border-dusk/25 bg-fog px-3 text-xs font-medium text-ink"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Conversation Panel (Left on desktop, below partner panel on mobile) */}
        <div className="order-2 flex flex-col rounded-lg border border-dusk/20 bg-fog p-4 sm:p-5 lg:order-1 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-dusk/15 pb-3">
            <h2 className="text-base font-semibold text-dusk">Messages</h2>
            <button
              type="button"
              onClick={fetchMessages}
              className="inline-flex min-h-[44px] items-center rounded px-3 text-xs font-medium text-dusk underline decoration-teal underline-offset-4 hover:bg-dusk/5"
            >
              Refresh messages
            </button>
          </div>

          {loading ? (
            <p className="py-10 text-left text-sm text-ink/75">
              Loading conversation...
            </p>
          ) : messages.length === 0 ? (
            <p className="py-10 text-left font-serif text-sm text-ink/80">
              No messages yet. Write a thoughtful opener of at least four words
              below to start unblurring photos.
            </p>
          ) : (
            <div className="my-4 max-h-96 space-y-3 overflow-y-auto pr-1">
              {messages.map((msg) => {
                const isMine = msg.sender_id === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2.5 font-serif text-sm leading-relaxed ${
                        isMine
                          ? "bg-dusk text-fog"
                          : "border border-dusk/20 bg-dusk/5 text-ink"
                      }`}
                    >
                      <p>{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="mt-auto space-y-3 border-t border-dusk/15 pt-4"
          >
            <div>
              <label
                htmlFor="chat-message-input"
                className="block text-xs font-medium text-ink"
              >
                Your message (4 words minimum)
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input
                  id="chat-message-input"
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write at least four words..."
                  className="min-h-[44px] flex-1 rounded border border-dusk/30 bg-fog px-3 py-2 text-sm text-ink placeholder:text-ink/50"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded bg-dusk px-5 text-sm font-medium text-fog hover:bg-dusk/90 disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send message"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink/75">
              <span>
                Word count:{" "}
                <strong className="text-dusk">{wordCount}/4 minimum</strong>
              </span>
              <span>
                Test replies by opening the other demo account in an incognito
                window.
              </span>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded border border-marigold bg-marigold/20 p-3 text-xs font-medium text-ink"
              >
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
