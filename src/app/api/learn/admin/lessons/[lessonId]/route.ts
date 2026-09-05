import { validate } from "@/lib/api/validation";
import { handleAdminAction, handleAdminJson } from "@/modules/learn/admin.http";
import { adminDeleteLesson, adminUpdateLesson, lessonUpdateSchema } from "@/modules/learn/admin.service";
import { lessonIdParamsSchema } from "@/modules/learn/admin.validation";
export const runtime = "nodejs";
type Context = { params: Promise<{ lessonId: string }> };
export async function PATCH(request: Request, context: Context) {
  const params = await context.params;
  return handleAdminJson(request, lessonUpdateSchema, (input) => adminUpdateLesson(validate(lessonIdParamsSchema, params).lessonId, input));
}
export async function DELETE(request: Request, context: Context) {
  return handleAdminAction(request, async () => adminDeleteLesson(validate(lessonIdParamsSchema, await context.params).lessonId));
}
