import { NextResponse } from "next/server";

import { learnErrorResponse } from "@/modules/learn/learn.errors";
import { getRelatedResources } from "@/modules/learn/learn.service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const data = await getRelatedResources(slug);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return learnErrorResponse(error);
  }
}
