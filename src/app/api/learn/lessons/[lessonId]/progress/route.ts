import { NextResponse } from "next/server";

import { readJsonBody, validate } from "@/lib/api/validation";
import { resolveDemoUser } from "@/modules/auth/demo-user";
import { lessonIdParamsSchema } from "@/modules/learn/admin.validation";
import { learnErrorResponse } from "@/modules/learn/learn.errors";
import { progressUpdateSchema } from "@/modules/learn/request.validation";
import { updateLessonProgressForUser } from "@/modules/learn/user-learning.service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ lessonId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const [user, { lessonId }] = await Promise.all([
      resolveDemoUser(request),
      context.params,
    ]);
    const input = await readJsonBody(request, progressUpdateSchema);
    const id = validate(lessonIdParamsSchema, { lessonId }).lessonId;
    const data = await updateLessonProgressForUser(user.id, id, input);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return learnErrorResponse(error);
  }
}
