"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { supabase } from "@/lib/supabase";

const FILTERS = { open: "Open", in_review: "In review", resolved: "Resolved" };
const ACTIONS = {
  review: "Mark in review",
  dismiss: "Dismiss report",
  warn: "Warn account",
  suspend: "Suspend account",
  restore: "Restore access",
};

type Filter = keyof typeof FILTERS;
type Action = keyof typeof ACTIONS;
type Report = { id: string; reason: string | null; created_at: string | null; moderation_status: Filter };
type Queue = { reports: Report[]; total: number };
type Detail = {
  report: Report;
  profile: { id: string; full_name: string; city: string; role_title: string | null } | null;
  suspended: boolean;
  actions: {
    id: string; action: Action; reason: string; notice: string | null;
    actor_id: string; created_at: string;
  }[];
};

const button = "min-h-11 rounded-lg border border-dusk/25 px-4 py-2 text-sm font-medium hover:bg-dusk/10 disabled:opacity-50";
const field = "w-full rounded-lg border border-dusk/25 bg-fog px-3 py-2 text-ink";

async function request<T>(query = "", decision?: { id: string; action: Action; reason: string; notice: string }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in with your founder account to continue.");
  const response = await fetch(`/api/moderation${query}`, {
    method: decision ? "POST" : "GET",
    headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: decision ? JSON.stringify(decision) : undefined,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Moderation is unavailable.");
  return body as T;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Time unavailable";
}

export default function AdminPage() {
  const [viewer, setViewer] = useState<string | null | undefined>(undefined);
  const [filter, setFilter] = useState<Filter>("open");
  const [page, setPage] = useState(0);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [action, setAction] = useState<Action | "">("");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const sendsNotice = action === "warn" || action === "suspend" || action === "restore";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setViewer(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setQueue(null);
    setDetail(null);
    setSelected(null);
    setError("");
    setFeedback("");
  }, [viewer]);

  useEffect(() => {
    if (!viewer) return;
    let current = true;
    const load = selected
      ? request<Detail>(`?id=${selected}`).then((result) => { if (current) setDetail(result); })
      : request<Queue>(`?status=${filter}&page=${page}`).then((result) => {
        if (!current) return;
        if (!result.reports.length && page > 0) setPage(page - 1);
        else setQueue(result);
      });
    void load.catch((error: Error) => { if (current) setError(error.message); });
    return () => { current = false; };
  }, [filter, page, selected, version, viewer]);

  function openReport(id: string | null) {
    setSelected(id);
    setDetail(null);
    setQueue(null);
    setAction("");
    setReason("");
    setNotice("");
    setError("");
    setFeedback("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !action || saving) return;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      await request<{ ok: boolean }>("", { id: selected, action, reason, notice });
      setFeedback("Decision saved.");
      setAction("");
      setReason("");
      setNotice("");
      setDetail(null);
      setVersion((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm underline">Back to Maithri</Link>
      <h1 className="text-3xl font-semibold text-dusk">Moderation</h1>
      {error && <p role="alert" className="rounded-lg bg-marigold/20 p-4">{error}</p>}
      {feedback && <p role="status" className="rounded-lg bg-teal/15 p-4">{feedback}</p>}
      {viewer === undefined ? <p role="status">Checking access…</p> : !viewer ? (
        <AuthForm founderSignIn />
      ) : selected ? (
        <>
          <button type="button" className={button} disabled={saving} onClick={() => openReport(null)}>Back to reports</button>
          {detail ? (
            <>
              <section className="space-y-3 rounded-xl border border-dusk/20 p-5">
                <p className="text-sm font-medium text-dusk">{FILTERS[detail.report.moderation_status]} · {formatDate(detail.report.created_at)}</p>
                <h2 className="text-xl font-semibold">{detail.profile?.full_name ?? "Profile unavailable"}</h2>
                <p className="text-sm">{[detail.profile?.city, detail.profile?.role_title].filter(Boolean).join(" · ")}</p>
                <p className="break-words whitespace-pre-wrap">{detail.report.reason || "No explanation provided."}</p>
                {detail.suspended && <p className="font-medium">Account suspended</p>}
              </section>
              <form onSubmit={submit} className="space-y-4 rounded-xl border border-dusk/20 p-5">
                <label className="block space-y-1">
                  <span className="block text-sm font-medium">Moderation action</span>
                  <select className={field} value={action} disabled={saving} required onChange={(event) => setAction(event.target.value as Action | "")}>
                    <option value="">Choose an action</option>
                    {detail.report.moderation_status !== "resolved" && (
                      <>
                        {detail.report.moderation_status === "open" && <option value="review">{ACTIONS.review}</option>}
                        <option value="dismiss">{ACTIONS.dismiss}</option>
                        <option value="warn">{ACTIONS.warn}</option>
                        <option value="suspend">{ACTIONS.suspend}</option>
                      </>
                    )}
                    {detail.suspended && <option value="restore">{ACTIONS.restore}</option>}
                  </select>
                </label>
                {action && (
                  <>
                    <label className="block space-y-1">
                      <span className="block text-sm font-medium">Internal reason</span>
                      <textarea className={field} value={reason} maxLength={1000} required disabled={saving} onChange={(event) => setReason(event.target.value)} />
                    </label>
                    {sendsNotice && (
                      <label className="block space-y-1">
                        <span className="block text-sm font-medium">Notice shown to the account holder</span>
                        <textarea className={field} value={notice} maxLength={1000} required disabled={saving} onChange={(event) => setNotice(event.target.value)} />
                      </label>
                    )}
                    <button className={button} disabled={saving || !reason.trim() || (sendsNotice && !notice.trim())}>{saving ? "Saving…" : "Save decision"}</button>
                  </>
                )}
              </form>
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-dusk">Account action history</h2>
                {detail.actions.length === 0 && <p>No moderation actions yet.</p>}
                <ul className="space-y-2">
                  {detail.actions.map((entry) => (
                    <li key={entry.id} className="space-y-1 break-words rounded-lg border border-dusk/20 p-4">
                      <p className="font-medium">{ACTIONS[entry.action]} · {formatDate(entry.created_at)}</p>
                      <p className="text-sm">{entry.reason}</p>
                      {entry.notice && <p className="text-sm">Account notice · {entry.notice}</p>}
                      <p className="text-xs text-ink/75">Actor {entry.actor_id}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : !error && <p role="status">Loading report…</p>}
        </>
      ) : (
        <section aria-label="Report queue" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FILTERS) as Filter[]).map((key) => (
              <button key={key} type="button" aria-pressed={filter === key}
                className={`${button} ${filter === key ? "bg-dusk/10" : ""}`}
                onClick={() => {
                  if (key === filter) return;
                  setError("");
                  setQueue(null);
                  setPage(0);
                  setFilter(key);
                }}>{FILTERS[key]}</button>
            ))}
          </div>
          {queue ? (
            <>
              {queue.reports.length === 0 && <p>No reports in this queue.</p>}
              <ul className="space-y-2">
                {queue.reports.map((report) => (
                  <li key={report.id}>
                    <button type="button" className={`${button} w-full break-words text-left`} onClick={() => openReport(report.id)}>
                      <span className="block">{report.reason || "No explanation provided"}</span>
                      <span className="text-xs text-ink/75">{formatDate(report.created_at)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {queue.total > 25 && (
                <div className="flex items-center gap-3">
                  <button type="button" className={button} disabled={page === 0} onClick={() => { setQueue(null); setPage(page - 1); }}>Previous</button>
                  <span>Page {page + 1} of {Math.ceil(queue.total / 25)}</span>
                  <button type="button" className={button} disabled={(page + 1) * 25 >= queue.total} onClick={() => { setQueue(null); setPage(page + 1); }}>Next</button>
                </div>
              )}
            </>
          ) : !error && <p role="status">Loading reports…</p>}
        </section>
      )}
    </main>
  );
}
