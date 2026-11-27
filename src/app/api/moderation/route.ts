import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getModerationStatus } from "@/lib/moderationServer";
import { deleteLiveKitRoom } from "@/lib/livekitServer";

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const ACTIONS = ["review", "dismiss", "warn", "suspend", "restore"];

async function authenticate(request: Request) {
  const founder = process.env.MAITHRI_FOUNDER_USER_ID?.trim();
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!founder || !token) return null;
  const admin = getSupabaseAdmin();
  const { data: { user } } = await admin.auth.getUser(token);
  return user?.email_confirmed_at && user.id === founder ? { admin, user } : null;
}

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  try {
    const access = await authenticate(request);
    if (!access) return reply({ error: "Founder access is required." }, 403);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      const status = searchParams.get("status") ?? "open";
      const page = Number(searchParams.get("page") ?? "0");
      if (!["open", "in_review", "resolved"].includes(status) || !Number.isSafeInteger(page) || page < 0 || page > 100000) {
        return reply({ error: "Invalid queue filter." }, 400);
      }
      const { data, error, count } = await access.admin.from("reports_blocks")
        .select("id, reason, created_at, moderation_status", { count: "exact" })
        .eq("moderation_status", status)
        .order("created_at", { ascending: false }).order("id")
        .range(page * 25, page * 25 + 24);
      if (error) throw error;
      return reply({ reports: data, total: count });
    }
    if (!UUID.test(id)) return reply({ error: "Invalid report ID." }, 400);
    const { data: report, error } = await access.admin.from("reports_blocks")
      .select("id, reason, created_at, moderation_status, reported_id")
      .eq("id", id).maybeSingle();
    if (error) throw error;
    if (!report) return reply({ error: "Report no longer exists." }, 404);

    const [profile, actions, account] = await Promise.all([
      access.admin.from("profiles").select("id, full_name, city, role_title").eq("id", report.reported_id).maybeSingle(),
      access.admin.from("moderation_actions").select("id, action, reason, notice, actor_id, created_at")
        .eq("user_id", report.reported_id).order("created_at", { ascending: false }).limit(50),
      getModerationStatus(access.admin, report.reported_id),
    ]);
    if (profile.error || actions.error) throw new Error("Could not load report details.");
    return reply({ report, profile: profile.data, actions: actions.data, suspended: account?.suspended ?? false });
  } catch {
    return reply({ error: "Could not load moderation data." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const access = await authenticate(request);
    if (!access) return reply({ error: "Founder access is required." }, 403);
    const body = await request.json().catch(() => null);
    const { id, action } = body ?? {};
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const notice = typeof body?.notice === "string" ? body.notice.trim() : "";
    const sendsNotice = ["warn", "suspend", "restore"].includes(action);
    if (typeof id !== "string" || !UUID.test(id) || !ACTIONS.includes(action)
      || !reason || reason.length > 1000 || (sendsNotice && (!notice || notice.length > 1000))) {
      return reply({ error: "Enter a valid action, reason, and any required account notice." }, 400);
    }
    const { data: rooms, error } = await access.admin.rpc("moderate_report", {
      p_report: id, p_actor: access.user.id, p_action: action, p_reason: reason,
      p_notice: sendsNotice ? notice : null,
    });
    if (error) {
      if (error.code === "22023") return reply({ error: error.message }, 409);
      if (error.code === "P0002") return reply({ error: "Report no longer exists." }, 404);
      throw error;
    }
    await Promise.all((rooms as string[]).map(deleteLiveKitRoom));
    return reply({ ok: true });
  } catch {
    return reply({ error: "Could not save the moderation decision." }, 500);
  }
}
