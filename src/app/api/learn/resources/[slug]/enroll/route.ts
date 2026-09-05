import { NextResponse } from "next/server";

import { resolveDemoUser } from "@/modules/auth/demo-user";
import { learnErrorResponse } from "@/modules/learn/learn.errors";
import { enrollInResource } from "@/modules/learn/user-learning.service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const [user, { slug }] = await Promise.all([
      resolveDemoUser(request),
      context.params,
    ]);
    const data = await enrollInResource(user.id, slug);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return learnErrorResponse(error);
  }
}
