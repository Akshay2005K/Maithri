import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getModerationStatus } from "@/lib/moderationServer";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return NextResponse.json({}, { status: 401 });
    const admin = getSupabaseAdmin();
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return NextResponse.json({}, { status: 401 });
    return NextResponse.json(await getModerationStatus(admin, user.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({}, { status: 503 });
  }
}
