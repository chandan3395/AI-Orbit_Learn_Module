import { NextResponse } from "next/server";

import { resolveDemoUser } from "@/modules/auth/demo-user";
import { learnErrorResponse } from "@/modules/learn/learn.errors";
import {
  addBookmark,
  removeBookmark,
} from "@/modules/learn/user-learning.service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const [user, { slug }] = await Promise.all([
      resolveDemoUser(request),
      context.params,
    ]);
    const data = await addBookmark(user.id, slug);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return learnErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const [user, { slug }] = await Promise.all([
      resolveDemoUser(request),
      context.params,
    ]);
    const data = await removeBookmark(user.id, slug);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return learnErrorResponse(error);
  }
}
