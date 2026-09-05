import { NextRequest, NextResponse } from "next/server";

import { resolveDemoUser } from "@/modules/auth/demo-user";
import { learnErrorResponse } from "@/modules/learn/learn.errors";
import { getPublicResource } from "@/modules/learn/learn.service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const user = await resolveDemoUser(request, { optional: true });
    const data = await getPublicResource(slug, user?.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return learnErrorResponse(error);
  }
}
