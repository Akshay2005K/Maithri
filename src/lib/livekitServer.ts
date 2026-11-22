import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";

export class LiveKitUnavailableError extends Error {
  constructor(message = "Calling service is temporarily unavailable.") {
    super(message);
    this.name = "LiveKitUnavailableError";
  }
}

function getLiveKitConfig(): {
  apiKey: string;
  apiSecret: string;
  wsUrl: string;
  httpUrl: string;
} {
  const apiKey = process.env.LIVEKIT_API_KEY?.trim() || "";
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim() || "";
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim() || "";

  if (!apiKey || !apiSecret || !wsUrl) {
    throw new LiveKitUnavailableError(
      "Calling is not configured on this server."
    );
  }

  let httpUrl = wsUrl;
  if (wsUrl.startsWith("wss://")) {
    httpUrl = `https://${wsUrl.slice(6)}`;
  } else if (wsUrl.startsWith("ws://")) {
    httpUrl = `http://${wsUrl.slice(5)}`;
  }

  return { apiKey, apiSecret, wsUrl, httpUrl };
}

export function isLiveKitConfigured(): boolean {
  return Boolean(
    process.env.LIVEKIT_API_KEY?.trim() &&
      process.env.LIVEKIT_API_SECRET?.trim() &&
      process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim()
  );
}

export function getLiveKitServerUrl(): string {
  return getLiveKitConfig().wsUrl;
}

function getRoomServiceClient(): RoomServiceClient {
  const { httpUrl, apiKey, apiSecret } = getLiveKitConfig();
  return new RoomServiceClient(httpUrl, apiKey, apiSecret);
}

export async function createLiveKitRoom(roomName: string): Promise<void> {
  try {
    const client = getRoomServiceClient();
    await client.createRoom({
      name: roomName,
      maxParticipants: 2,
      emptyTimeout: 300,
      departureTimeout: 20,
    });
  } catch (err) {
    if (err instanceof LiveKitUnavailableError) {
      throw err;
    }
    throw new LiveKitUnavailableError(
      "Calling service is temporarily unavailable. Please try again in a moment."
    );
  }
}

export async function createLiveKitToken(params: {
  roomName: string;
  userId: string;
  firstName: string;
  callType: "audio" | "video";
}): Promise<{ token: string; serverUrl: string }> {
  const { apiKey, apiSecret, wsUrl } = getLiveKitConfig();

  const at = new AccessToken(apiKey, apiSecret, {
    identity: params.userId,
    name: params.firstName,
    ttl: "45m",
  });

  at.addGrant({
    roomJoin: true,
    room: params.roomName,
    canSubscribe: true,
    canPublish: true,
    canPublishData: false,
    canPublishSources:
      params.callType === "audio"
        ? [TrackSource.MICROPHONE]
        : [TrackSource.MICROPHONE, TrackSource.CAMERA],
  });

  const token = await at.toJwt();
  return { token, serverUrl: wsUrl };
}

export async function deleteLiveKitRoom(roomName: string): Promise<void> {
  if (!roomName || !isLiveKitConfigured()) return;
  try {
    const client = getRoomServiceClient();
    await client.deleteRoom(roomName);
  } catch {
    // Ignore cleanup errors if the room already expired or was deleted.
  }
}
