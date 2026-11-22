import { NextResponse } from "next/server";
import { isLiveKitConfigured } from "@/lib/livekitServer";

export async function GET() {
  return NextResponse.json(
    { enabled: isLiveKitConfigured() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
