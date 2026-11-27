import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

import { flushProfileMediaCleanup, PROFILE_MEDIA_BUCKET as BUCKET } from "@/lib/profileMediaServer";
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

async function verifyUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return { error: "Missing authorization token.", status: 401 as const };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const {
    data: { user },
    error: verifyError,
  } = await supabaseAdmin.auth.getUser(token);

  if (verifyError || !user) {
    return { error: "Invalid or expired session.", status: 401 as const };
  }
  if (!user.email_confirmed_at) {
    return { error: "Verify your email before uploading media.", status: 403 as const };
  }

  return { user, supabaseAdmin };
}

export async function POST(request: Request) {
  try {
    const auth = await verifyUser(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { user, supabaseAdmin } = auth;

    const formData = await request.formData();
    const kind = formData.get("kind");

    if (kind === "photo") {
      const fullFile = formData.get("full");
      const blur2File = formData.get("blur2");
      const blur1File = formData.get("blur1");

      if (
        !(fullFile instanceof File) ||
        !(blur2File instanceof File) ||
        !(blur1File instanceof File)
      ) {
        return NextResponse.json(
          { error: "Missing photo files (full, blur2, blur1)." },
          { status: 400 }
        );
      }

      if (
        fullFile.size > MAX_FILE_BYTES ||
        blur2File.size > MAX_FILE_BYTES ||
        blur1File.size > MAX_FILE_BYTES
      ) {
        return NextResponse.json(
          { error: "Image must be 2 MB or smaller." },
          { status: 400 }
        );
      }

      const prefix = `${user.id}/photo-${randomUUID()}`;
      const paths = {
        full: `${prefix}-full.webp`,
        blur2: `${prefix}-blur2.webp`,
        blur1: `${prefix}-blur1.webp`,
      };

      const uploads = await Promise.all([
        supabaseAdmin.storage
          .from(BUCKET)
          .upload(paths.full, Buffer.from(await fullFile.arrayBuffer()), {
            contentType: fullFile.type || "image/webp",
          }),
        supabaseAdmin.storage
          .from(BUCKET)
          .upload(paths.blur2, Buffer.from(await blur2File.arrayBuffer()), {
            contentType: blur2File.type || "image/webp",
          }),
        supabaseAdmin.storage
          .from(BUCKET)
          .upload(paths.blur1, Buffer.from(await blur1File.arrayBuffer()), {
            contentType: blur1File.type || "image/webp",
          }),
      ]);

      const firstErr = uploads.find((u) => u.error)?.error;
      if (firstErr) {
        await supabaseAdmin.storage.from(BUCKET).remove(Object.values(paths));
        return NextResponse.json({ error: firstErr.message }, { status: 500 });
      }

      const { data: updated, error: dbErr } = await supabaseAdmin
        .from("profiles")
        .update({ photo_paths: paths })
        .eq("id", user.id)
        .select()
        .single();

      if (dbErr) {
        return NextResponse.json({ error: dbErr.message }, { status: 500 });
      }

      await flushProfileMediaCleanup(supabaseAdmin, user.id).catch(console.error);
      return NextResponse.json({ profile: updated });
    }

    if (kind === "voice") {
      const audioFile = formData.get("audio");
      if (!(audioFile instanceof File)) {
        return NextResponse.json(
          { error: "Missing audio file." },
          { status: 400 }
        );
      }
      if (audioFile.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: "Voice intro must be 2 MB or smaller." },
          { status: 400 }
        );
      }

      const voicePath = `${user.id}/voice-${randomUUID()}.webm`;
      const { error: uploadErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(voicePath, Buffer.from(await audioFile.arrayBuffer()), {
          contentType: audioFile.type || "audio/webm",
        });

      if (uploadErr) {
        return NextResponse.json({ error: uploadErr.message }, { status: 500 });
      }

      const { data: updated, error: dbErr } = await supabaseAdmin
        .from("profiles")
        .update({ voice_intro_path: voicePath })
        .eq("id", user.id)
        .select()
        .single();

      if (dbErr) {
        return NextResponse.json({ error: dbErr.message }, { status: 500 });
      }

      await flushProfileMediaCleanup(supabaseAdmin, user.id).catch(console.error);
      return NextResponse.json({ profile: updated });
    }

    return NextResponse.json({ error: "Invalid upload kind." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to upload media.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await verifyUser(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { user, supabaseAdmin } = auth;

    const url = new URL(request.url);
    const kind = url.searchParams.get("kind");

    if (kind === "photo") {
      const { data: updated, error: dbErr } = await supabaseAdmin
        .from("profiles")
        .update({ photo_paths: null })
        .eq("id", user.id)
        .select()
        .single();
      if (dbErr) {
        return NextResponse.json({ error: dbErr.message }, { status: 500 });
      }
      await flushProfileMediaCleanup(supabaseAdmin, user.id);
      return NextResponse.json({ profile: updated });
    }

    if (kind === "voice") {
      const { data: updated, error: dbErr } = await supabaseAdmin
        .from("profiles")
        .update({ voice_intro_path: null })
        .eq("id", user.id)
        .select()
        .single();
      if (dbErr) {
        return NextResponse.json({ error: dbErr.message }, { status: 500 });
      }
      await flushProfileMediaCleanup(supabaseAdmin, user.id);
      return NextResponse.json({ profile: updated });
    }

    return NextResponse.json({ error: "Invalid delete kind." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to remove media.",
      },
      { status: 500 }
    );
  }
}
