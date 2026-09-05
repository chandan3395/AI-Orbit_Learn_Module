import { NextResponse } from "next/server";

import { resolveDemoUser } from "@/modules/auth/demo-user";
import { learnErrorResponse } from "@/modules/learn/learn.errors";
import { getContinueLearning } from "@/modules/learn/user-learning.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await resolveDemoUser(request);
    const data = await getContinueLearning(user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return learnErrorResponse(error);
  }
}
