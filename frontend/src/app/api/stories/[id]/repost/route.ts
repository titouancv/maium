import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { STORY_SELECT, mapStoryFromDb, type DbStoryRaw } from "@/lib/mappers/story";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

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

    // A story can only be reposted once: bail if the viewer already has a repost
    // of it (the client toggles to « remove repost » in that case).
    const { data: existing } = await supabase
      .from("stories")
      .select("id")
      .eq("author_id", user.id)
      .eq("is_repost", true)
      .eq("original_story_id", original.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Already reposted" },
        { status: 409 },
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

    // A fresh repost is unseen until the author opens it, so their own bubble
    // shows the unseen ring immediately.
    const story = mapStoryFromDb(data as unknown as DbStoryRaw, {
      seen: false,
      likedByMe: false,
      repostedByMe: false,
      likeCount: 0,
      repostCount: 0,
    });
    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/stories/[id]/repost]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Remove the viewer's repost of the story `id`. Deletes the viewer's repost row
 * (RLS restricts deletes to the author) and returns its id so the client can
 * drop it from the feed.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { id } = await params;

    const { data, error } = await supabase
      .from("stories")
      .delete()
      .eq("author_id", user.id)
      .eq("is_repost", true)
      .eq("original_story_id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: "Repost not found" }, { status: 404 });
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("[DELETE /api/stories/[id]/repost]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
