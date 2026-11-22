"use client";

import { useEffect, useState } from "react";
import {
  ConnectionState,
  DisconnectReason,
  MediaDeviceFailure,
  Track,
} from "livekit-client";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  isTrackReference,
  useConnectionState,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { supabase } from "@/lib/supabase";

interface CallRow {
  id: string;
  match_id: string;
  caller_id: string;
  callee_id: string;
  call_type: "audio" | "video";
  status: "ringing" | "active" | "ended" | "declined" | "missed";
  room_name: string;
  room_url: string;
  created_at: string;
}

interface CallPanelProps {
  matchId: string;
  currentUserId: string;
  partnerFirstName: string;
  unblurLevel: number;
  isClosed: boolean;
}

function describeMediaFailure(
  failure?: MediaDeviceFailure,
  kind?: MediaDeviceKind
): string {
  const deviceLabel =
    kind === "videoinput"
      ? "camera"
      : kind === "audioinput"
        ? "microphone"
        : "microphone or camera";

  if (failure === MediaDeviceFailure.PermissionDenied) {
    return `Permission to use your ${deviceLabel} was denied. Allow access in your browser settings and try again.`;
  }
  if (failure === MediaDeviceFailure.NotFound) {
    return `No ${deviceLabel} was found on this device. Connect one and try again.`;
  }
  if (failure === MediaDeviceFailure.DeviceInUse) {
    return `Your ${deviceLabel} is currently in use by another app.`;
  }
  return `Could not access your ${deviceLabel}. Check your device permissions and try again.`;
}

function InCallStage({
  callType,
  partnerFirstName,
  busy,
  onLeave,
  onMediaError,
}: {
  callType: "audio" | "video";
  partnerFirstName: string;
  busy: boolean;
  onLeave: () => void;
  onMediaError: (message: string) => void;
}) {
  const connectionState = useConnectionState();
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
  } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const [partnerJoinedOnce, setPartnerJoinedOnce] = useState(false);

  useEffect(() => {
    if (remoteParticipants.length > 0) {
      setPartnerJoinedOnce(true);
    }
  }, [remoteParticipants.length]);

  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: false }],
    { onlySubscribed: false }
  );

  const realCameraTracks = cameraTracks.filter(isTrackReference);

  const remoteVideo = realCameraTracks.find(
    (trackRef) => !trackRef.participant.isLocal
  );
  const localVideo = realCameraTracks.find(
    (trackRef) => trackRef.participant.isLocal
  );

  const partnerPresent = remoteParticipants.length > 0;
  const partnerLeft = partnerJoinedOnce && !partnerPresent;

  async function toggleMic() {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      onMediaError(
        "Could not toggle your microphone. Check browser permissions."
      );
    }
  }

  async function toggleCamera() {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch {
      onMediaError("Could not toggle your camera. Check browser permissions.");
    }
  }

  const statusText =
    connectionState === ConnectionState.Connecting
      ? "Connecting to call..."
      : connectionState === ConnectionState.Reconnecting
        ? "Connection lost. Reconnecting..."
        : partnerLeft
          ? `${partnerFirstName} left the call.`
          : partnerPresent
            ? `In call with ${partnerFirstName}`
            : `Waiting for ${partnerFirstName} to join...`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-dusk/20 bg-fog px-3 py-2 text-xs">
        <span className="font-medium text-dusk">{statusText}</span>
        <span className="text-ink/60">
          {callType === "video" ? "Video" : "Voice"}
        </span>
      </div>

      {callType === "video" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-dusk/20 bg-ink/10">
            {remoteVideo ? (
              <VideoTrack
                trackRef={remoteVideo}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="px-3 text-center text-xs text-ink/70">
                {partnerLeft
                  ? `${partnerFirstName} left`
                  : partnerPresent
                    ? `${partnerFirstName}'s camera is off`
                    : `Waiting for ${partnerFirstName}...`}
              </span>
            )}
          </div>
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-dusk/20 bg-ink/10">
            {localVideo && isCameraEnabled ? (
              <VideoTrack
                trackRef={localVideo}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-ink/70">Your camera is off</span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleMic}
          aria-pressed={!isMicrophoneEnabled}
          className="inline-flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded border border-dusk/30 bg-fog px-3 text-xs font-medium text-dusk transition-colors hover:bg-dusk/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          {isMicrophoneEnabled ? "Mute" : "Unmute"}
        </button>

        {callType === "video" && (
          <button
            type="button"
            onClick={toggleCamera}
            aria-pressed={!isCameraEnabled}
            className="inline-flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded border border-dusk/30 bg-fog px-3 text-xs font-medium text-dusk transition-colors hover:bg-dusk/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            {isCameraEnabled ? "Camera off" : "Camera on"}
          </button>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={onLeave}
          className="inline-flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded border border-marigold bg-marigold/20 px-3 text-xs font-medium text-ink transition-colors hover:bg-marigold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 disabled:opacity-50 motion-reduce:transition-none"
        >
          Leave
        </button>
      </div>
    </div>
  );
}

export default function CallPanel({
  matchId,
  currentUserId,
  partnerFirstName,
  unblurLevel,
  isClosed,
}: CallPanelProps) {
  const [callingEnabled, setCallingEnabled] = useState<boolean | null>(
    process.env.NEXT_PUBLIC_LIVEKIT_URL ? null : false
  );
  const [activeCall, setActiveCall] = useState<CallRow | null>(null);
  const [meetingToken, setMeetingToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(
    process.env.NEXT_PUBLIC_LIVEKIT_URL ?? null
  );
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_LIVEKIT_URL) {
      setCallingEnabled(false);
      return;
    }
    let cancelled = false;
    fetch("/api/calls/config")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setCallingEnabled(Boolean(data?.enabled));
        }
      })
      .catch(() => {
        if (!cancelled) setCallingEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadLatestCall() {
    const { data } = await supabase
      .from("calls")
      .select("*")
      .eq("match_id", matchId)
      .in("status", ["ringing", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setActiveCall((data as CallRow) ?? null);
  }

  useEffect(() => {
    if (!callingEnabled) return;
    loadLatestCall();

    const channel = supabase
      .channel(`calls-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calls",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as CallRow;
          if (row.status === "ringing" || row.status === "active") {
            setStatusNotice(null);
            setActiveCall(row);
          } else {
            setActiveCall((prev) => {
              if (prev?.id !== row.id) return prev;
              if (row.status === "declined") {
                setStatusNotice(`${partnerFirstName} declined the call.`);
              } else if (row.status === "missed") {
                setStatusNotice("Call missed.");
              } else if (row.status === "ended" && prev.status === "ringing") {
                setStatusNotice("Call cancelled.");
              }
              return null;
            });
            setMeetingToken(null);
          }
        }
      )
      .subscribe();

    const interval = setInterval(loadLatestCall, 5000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, callingEnabled, partnerFirstName]);

  async function handleStartCall(callType: "audio" | "video") {
    setError(null);
    setStatusNotice(null);
    setBusy(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again to call.");

      const res = await fetch("/api/calls/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ matchId, callType }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Could not start call.");
      }

      setActiveCall(body.call as CallRow);
      setMeetingToken(body.token as string);
      if (typeof body.serverUrl === "string") {
        setServerUrl(body.serverUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start call.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRespond(action: "accept" | "decline" | "end") {
    if (!activeCall) return;
    setError(null);
    setStatusNotice(null);
    setBusy(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again.");

      const endpoint =
        action === "accept"
          ? "/api/calls/accept"
          : action === "decline"
            ? "/api/calls/decline"
            : "/api/calls/end";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ callId: activeCall.id }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Could not update call.");
      }

      if (action === "accept") {
        setActiveCall(body.call as CallRow);
        setMeetingToken(body.token as string);
        if (typeof body.serverUrl === "string") {
          setServerUrl(body.serverUrl);
        }
      } else {
        setActiveCall(null);
        setMeetingToken(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update call.");
    } finally {
      setBusy(false);
    }
  }

  if (isClosed || callingEnabled !== true) return null;

  const canVoiceCall = unblurLevel >= 2;
  const canVideoCall = unblurLevel >= 3;
  const isCaller = activeCall?.caller_id === currentUserId;
  const isIncoming = activeCall?.status === "ringing" && !isCaller;

  return (
    <div className="space-y-3 rounded-lg border border-dusk/20 bg-dusk/5 p-4">
      <div>
        <h3 className="text-sm font-semibold text-dusk">
          Voice and video call
        </h3>
        <p className="mt-0.5 text-xs text-ink/75">
          Private 1-on-1 call powered by LiveKit.
        </p>
      </div>

      {!activeCall ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !canVoiceCall}
              title={
                canVoiceCall
                  ? undefined
                  : "Unlocks at Level 2 after mutual messages"
              }
              onClick={() => handleStartCall("audio")}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded border border-dusk/30 bg-fog px-3 text-xs font-medium text-dusk transition-colors hover:bg-dusk/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              Voice call
            </button>
            <button
              type="button"
              disabled={busy || !canVideoCall}
              title={
                canVideoCall
                  ? undefined
                  : "Unlocks at Level 3 after 3+ valid messages each"
              }
              onClick={() => handleStartCall("video")}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded bg-dusk px-3 text-xs font-medium text-fog transition-colors hover:bg-dusk/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              Video call
            </button>
          </div>
          {(!canVoiceCall || !canVideoCall) && (
            <p className="text-[11px] leading-relaxed text-ink/75">
              {!canVoiceCall
                ? "Voice calls unlock at Level 2; video calls unlock at Level 3."
                : "Voice calls are unlocked. Video calls unlock at Level 3."}
            </p>
          )}
        </div>
      ) : isIncoming ? (
        <div className="space-y-2.5 rounded border border-teal bg-teal/15 p-3 text-xs">
          <p className="font-semibold text-dusk">
            Incoming {activeCall.call_type === "audio" ? "voice" : "video"} call
            from {partnerFirstName}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleRespond("accept")}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded bg-dusk px-3 text-xs font-medium text-fog transition-colors hover:bg-dusk/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 disabled:opacity-50 motion-reduce:transition-none"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleRespond("decline")}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded border border-marigold bg-marigold/20 px-3 text-xs font-medium text-ink transition-colors hover:bg-marigold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 disabled:opacity-50 motion-reduce:transition-none"
            >
              Decline
            </button>
          </div>
        </div>
      ) : activeCall.status === "ringing" ? (
        <div className="space-y-2 rounded border border-dusk/20 bg-fog p-3 text-xs">
          <p className="font-medium text-dusk">
            Calling {partnerFirstName} (
            {activeCall.call_type === "audio" ? "voice" : "video"})...
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleRespond("end")}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded border border-marigold bg-marigold/20 px-3 text-xs font-medium text-ink transition-colors hover:bg-marigold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 disabled:opacity-50 motion-reduce:transition-none"
          >
            Cancel call
          </button>
        </div>
      ) : meetingToken && serverUrl ? (
        <div data-lk-theme="default" className="lk-call-panel space-y-2.5">
          <LiveKitRoom
            token={meetingToken}
            serverUrl={serverUrl}
            connect={true}
            audio={true}
            video={activeCall.call_type === "video"}
            onMediaDeviceFailure={(failure, kind) => {
              setError(describeMediaFailure(failure, kind));
            }}
            onDisconnected={(reason) => {
              if (
                reason !== undefined &&
                reason !== DisconnectReason.CLIENT_INITIATED
              ) {
                setStatusNotice("Connection lost. The call has ended.");
              }
            }}
            onError={(err) => {
              setError(
                err.message ||
                  "Connection error. Try leaving and starting a new call."
              );
            }}
          >
            <RoomAudioRenderer />
            <InCallStage
              callType={activeCall.call_type}
              partnerFirstName={partnerFirstName}
              busy={busy}
              onLeave={() => handleRespond("end")}
              onMediaError={(msg) => setError(msg)}
            />
          </LiveKitRoom>
        </div>
      ) : (
        <div className="space-y-2 rounded border border-dusk/20 bg-fog p-3 text-xs">
          <p className="text-ink/80">
            Call is active in another session or needs to be rejoined.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleRespond("end")}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded border border-marigold bg-marigold/20 px-3 text-xs font-medium text-ink transition-colors hover:bg-marigold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk focus-visible:ring-offset-2 disabled:opacity-50 motion-reduce:transition-none"
          >
            End call
          </button>
        </div>
      )}

      {statusNotice && !error && (
        <p
          role="status"
          className="rounded border border-dusk/20 bg-fog p-2.5 text-xs text-ink/80"
        >
          {statusNotice}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded border border-marigold bg-marigold/20 p-2.5 text-xs font-medium text-ink"
        >
          {error}
        </p>
      )}
    </div>
  );
}
