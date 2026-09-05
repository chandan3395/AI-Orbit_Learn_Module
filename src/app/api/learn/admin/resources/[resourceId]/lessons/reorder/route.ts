import { validate } from "@/lib/api/validation";
import { handleAdminJson } from "@/modules/learn/admin.http";
import { adminReorderLessons } from "@/modules/learn/admin.service";
import { lessonReorderSchema, resourceIdParamsSchema } from "@/modules/learn/admin.validation";
export const runtime = "nodejs";
type Context = { params: Promise<{ resourceId: string }> };
export async function PATCH(request: Request, context: Context) {
  const params = await context.params;
  return handleAdminJson(request, lessonReorderSchema, (input) => adminReorderLessons(validate(resourceIdParamsSchema, params).resourceId, input.lessonIds));
}
