import { NextResponse } from "next/server";

import { resolveDemoUser } from "@/modules/auth/demo-user";
import { LearnApiError, learnErrorResponse } from "@/modules/learn/learn.errors";
import {
  parseProgressUpdate,
  updateLessonProgressForUser,
} from "@/modules/learn/user-learning.service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ lessonId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const [user, { lessonId }] = await Promise.all([
      resolveDemoUser(request),
      context.params,
    ]);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new LearnApiError(400, "INVALID_PROGRESS", "Invalid JSON body");
    }
    const input = parseProgressUpdate(body);
    const data = await updateLessonProgressForUser(user.id, lessonId, input);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return learnErrorResponse(error);
  }
}
