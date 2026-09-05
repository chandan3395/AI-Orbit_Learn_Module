import { validate } from "@/lib/api/validation";
import { handleAdminJson } from "@/modules/learn/admin.http";
import { adminCreateLesson, lessonCreateSchema } from "@/modules/learn/admin.service";
import { resourceIdParamsSchema } from "@/modules/learn/admin.validation";
export const runtime = "nodejs";
type Context = { params: Promise<{ resourceId: string }> };
export async function POST(request: Request, context: Context) {
  const params = await context.params;
  return handleAdminJson(request, lessonCreateSchema, (input) => adminCreateLesson(validate(resourceIdParamsSchema, params).resourceId, input), 201);
}
