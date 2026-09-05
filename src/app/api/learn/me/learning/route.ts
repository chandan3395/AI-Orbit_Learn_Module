import { NextRequest, NextResponse } from "next/server";

import { resolveDemoUser } from "@/modules/auth/demo-user";
import { learnErrorResponse } from "@/modules/learn/learn.errors";
import { getMyLearning } from "@/modules/learn/user-learning.service";
import type { RawMyLearningQuery } from "@/modules/learn/user-learning.types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await resolveDemoUser(request);
    const query = Object.fromEntries(
      request.nextUrl.searchParams.entries(),
    ) as RawMyLearningQuery;
    const result = await getMyLearning(user.id, query);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return learnErrorResponse(error);
  }
}
