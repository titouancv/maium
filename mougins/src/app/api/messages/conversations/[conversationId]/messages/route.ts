import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getMessages } from "@/lib/messaging/server";
import { MESSAGES_PAGE_SIZE } from "@/constants";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { conversationId } = await params;
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;

    const before = request.nextUrl.searchParams.get("before") ?? undefined;
    const messages = await getMessages(conversationId, { before });

    return NextResponse.json({
      messages,
      hasMore: messages.length === MESSAGES_PAGE_SIZE,
    });
  } catch (error) {
    console.error("[GET /api/messages/conversations/:id/messages]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { conversationId } = await params;
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select(
        `id, conversation_id, sender_id, content, created_at, edited_at, deleted_at,
         sender:sender_id ( pseudo, first_name, last_name, profile_photo )`,
      )
      .single();

    if (error) {
      if (error.code === "42501") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      throw error;
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/messages/conversations/:id/messages]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
