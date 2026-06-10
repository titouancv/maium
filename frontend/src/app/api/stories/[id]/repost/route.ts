import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STORY_SELECT, mapStoryFromDb, type DbStoryRaw } from "@/lib/mappers/story";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Load the story being reposted. RLS guarantees it is visible to the viewer.
    const { data: original } = await supabase
      .from("stories")
      .select("id, author_id, content")
      .eq("id", id)
      .single();

    if (!original) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (original.author_id === user.id) {
      return NextResponse.json(
        { error: "Cannot repost your own story" },
        { status: 400 },
      );
    }

    // Copy the content so the repost renders standalone, and keep references to
    // the original story / author for the « Republié depuis @… » mention.
    const { data, error } = await supabase
      .from("stories")
      .insert({
        author_id: user.id,
        content: original.content,
        is_repost: true,
        original_author_id: original.author_id,
        original_story_id: original.id,
      })
      .select(STORY_SELECT)
      .single();

    if (error) throw error;

    const story = mapStoryFromDb(data as unknown as DbStoryRaw, {
      seen: true,
      likedByMe: false,
    });
    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/stories/[id]/repost]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
