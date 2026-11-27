"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Notice = { suspended: boolean; notice: string };

export default function ModerationNotice() {
  const [userId, setUserId] = useState<string | null>(null);
  const [account, setAccount] = useState<{ userId: string; notice: Notice | null } | null>(null);
  const [dismissed, setDismissed] = useState<Notice | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let disposed = false;
    let pending = false;

    async function refresh() {
      if (pending || disposed || !userId) return;
      pending = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user.id !== userId) return;
        const response = await fetch("/api/moderation/status", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) return;
        const notice = await response.json() as Notice | null;
        if (!disposed) setAccount({ userId, notice });
      } catch {
        // The next refresh retries a temporarily unavailable notice.
      } finally {
        pending = false;
      }
    }

    void refresh();
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [userId]);

  const notice = userId && account?.userId === userId ? account.notice : null;
  if (!notice || (!notice.suspended && notice.notice === dismissed?.notice)) return null;

  return (
    <aside role="status" className="border-b border-marigold bg-marigold/20 px-4 py-3 text-ink">
      <div className="mx-auto flex max-w-[1100px] items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold">{notice.suspended ? "Account suspended" : "Account notice"}</p>
          <p className="break-words whitespace-pre-wrap text-sm">{notice.notice}</p>
        </div>
        {!notice.suspended && (
          <button type="button" className="min-h-11 underline" onClick={() => setDismissed(notice)}>Dismiss</button>
        )}
      </div>
    </aside>
  );
}
