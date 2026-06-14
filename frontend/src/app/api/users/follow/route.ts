import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function getFollowedId(pseudo: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("id").eq("pseudo", pseudo).single();
  return data?.id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { pseudo } = await request.json();
    if (!pseudo) {
      return NextResponse.json({ error: "Missing pseudo" }, { status: 400 });
    }

    const followedId = await getFollowedId(pseudo);
    if (!followedId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (followedId === user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_follows")
      .insert({ follower_id: user.id, followed_id: followedId });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already following" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/users/follow]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { pseudo } = await request.json();
    if (!pseudo) {
      return NextResponse.json({ error: "Missing pseudo" }, { status: 400 });
    }

    const followedId = await getFollowedId(pseudo);
    if (!followedId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followed_id", followedId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /api/users/follow]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
