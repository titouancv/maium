import { NextRequest, NextResponse } from "next/server";
import { getFollowers } from "@/lib/users";

export async function GET(request: NextRequest) {
  try {
    const pseudo = request.nextUrl.searchParams.get("pseudo");
    if (!pseudo) {
      return NextResponse.json({ error: "Missing pseudo" }, { status: 400 });
    }

    const users = await getFollowers(pseudo);
    if (users === null) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[GET /api/users/followers]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
