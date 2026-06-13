import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STORY_SELECT, mapStoryFromDb, type DbStoryRaw } from "@/lib/mappers/story";

/** Max characters allowed in a story body. */
const STORY_MAX_LENGTH = 5000;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    const trimmed = typeof content === "string" ? content.trim() : "";
    if (!trimmed) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }
    if (trimmed.length > STORY_MAX_LENGTH) {
      return NextResponse.json({ error: "Content too long" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("stories")
      .insert({ author_id: user.id, content: trimmed })
      .select(STORY_SELECT)
      .single();

    if (error) throw error;

    // The author has implicitly "seen" their own story (no unseen ring on self).
    const story = mapStoryFromDb(data as unknown as DbStoryRaw, {
      seen: true,
      likedByMe: false,
      repostedByMe: false,
    });
    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/stories]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
