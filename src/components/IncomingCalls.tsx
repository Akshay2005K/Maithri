"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import CallPanel, { type CallRow } from "@/components/CallPanel";
import { supabase } from "@/lib/supabase";

interface IncomingCall {
  call: CallRow;
  callerName: string;
}

export default function IncomingCalls() {
  const session = useRef<Session | null>(null);
  const refresh = useRef<() => void>(() => {});
  const [userId, setUserId] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      session.current = next;
      setUserId(next?.user.email_confirmed_at ? next.user.id : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    let sessionId = crypto.randomUUID();
    let token = session.current?.access_token;
    let selectedCallId: string | undefined;
    let paused = false;
    let disposed = false;
    let inFlight = false;
    let refreshQueued = false;

    function send(id: string, leaving = false) {
      return fetch("/api/calls/presence", {
        method: "POST",
        keepalive: leaving,
        signal: leaving ? undefined : AbortSignal.timeout(7000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: id, leaving, selectedCallId }),
      });
    }

    async function sync() {
      if (paused || disposed || session.current?.user.id !== userId) return;
      if (inFlight) {
        refreshQueued = true;
        return;
      }

      token = session.current.access_token;
      const id = sessionId;
      inFlight = true;
      try {
        const response = await send(id);
        if (!response.ok) return;
        const result = await response.json();
        if (!disposed && !paused && id === sessionId && session.current?.user.id === userId) {
          selectedCallId = result.call?.id;
          setIncoming(result.call ? result as IncomingCall : null);
        }
      } catch {
        // The interval retries presence and call discovery after a disconnect.
      } finally {
        inFlight = false;
        if (refreshQueued) {
          refreshQueued = false;
          void sync();
        }
      }
    }

    function leave() {
      if (paused) return;
      paused = true;
      if (token) void send(sessionId, true).catch(() => {});
    }

    function resume() {
      if (!paused) return;
      sessionId = crypto.randomUUID();
      selectedCallId = undefined;
      setIncoming(null);
      paused = false;
      void sync();
    }

    function hideOfflineRing() {
      setIncoming((current) => current?.call.status === "ringing" ? null : current);
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void sync();
    }

    refresh.current = () => void sync();
    const channel = supabase.channel(`incoming-calls-${sessionId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "calls",
        filter: `callee_id=eq.${userId}`,
      }, refresh.current)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void sync();
      });

    const interval = window.setInterval(sync, 8000);
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", resume);
    window.addEventListener("online", refresh.current);
    window.addEventListener("offline", hideOfflineRing);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    void sync();

    return () => {
      disposed = true;
      leave();
      window.clearInterval(interval);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("online", refresh.current);
      window.removeEventListener("offline", hideOfflineRing);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void supabase.removeChannel(channel);
      refresh.current = () => {};
    };
  }, [userId]);

  if (!incoming || incoming.call.callee_id !== userId) return null;

  return (
    <CallPanel
      key={incoming.call.id}
      matchId={incoming.call.match_id}
      currentUserId={userId}
      partnerFirstName={incoming.callerName}
      isClosed={false}
      incomingCall={incoming.call}
      onIncomingResponse={() => refresh.current()}
    />
  );
}
