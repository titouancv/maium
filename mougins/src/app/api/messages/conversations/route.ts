import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getConversations } from "@/lib/messaging/server";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;

    const conversations = await getConversations();
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[GET /api/messages/conversations]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { targetPseudo } = await request.json();
    if (!targetPseudo) {
      return NextResponse.json({ error: "Missing targetPseudo" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: targetUser } = await admin
      .from("users")
      .select("id")
      .eq("pseudo", targetPseudo)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserId = targetUser.id;

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "Cannot start a conversation with yourself" },
        { status: 400 },
      );
    }

    const { data: existing } = await supabase
      .from("conversation_members")
      .select("conversation_id, conversations!inner(is_group)")
      .eq("user_id", user.id);

    if (existing) {
      for (const row of existing) {
        const conv = row.conversations as unknown as { is_group: boolean };
        if (conv.is_group) continue;

        const { data: otherMembers } = await supabase
          .from("conversation_members")
          .select("user_id")
          .eq("conversation_id", row.conversation_id)
          .neq("user_id", user.id);

        if (
          otherMembers?.length === 1 &&
          otherMembers[0].user_id === targetUserId
        ) {
          return NextResponse.json({
            conversationId: row.conversation_id,
            created: false,
          });
        }
      }
    }

    const { data: conversation, error: convError } = await admin
      .from("conversations")
      .insert({ is_group: false })
      .select("id")
      .single();

    if (convError || !conversation) throw convError;

    const { error: membersError } = await admin
      .from("conversation_members")
      .insert([
        { conversation_id: conversation.id, user_id: user.id },
        { conversation_id: conversation.id, user_id: targetUserId },
      ]);

    if (membersError) throw membersError;

    return NextResponse.json(
      { conversationId: conversation.id, created: true },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/messages/conversations]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
