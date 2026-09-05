import { validate } from "@/lib/api/validation";
import { handleAdminAction, handleAdminJson } from "@/modules/learn/admin.http";
import { adminDeleteResource, adminUpdateResource, resourceUpdateSchema } from "@/modules/learn/admin.service";
import { resourceIdParamsSchema } from "@/modules/learn/admin.validation";
export const runtime = "nodejs";
type Context = { params: Promise<{ resourceId: string }> };
export async function PATCH(request: Request, context: Context) {
  const params = await context.params;
  return handleAdminJson(request, resourceUpdateSchema, (input) => adminUpdateResource(validate(resourceIdParamsSchema, params).resourceId, input));
}
export async function DELETE(request: Request, context: Context) {
  return handleAdminAction(request, async () => adminDeleteResource(validate(resourceIdParamsSchema, await context.params).resourceId));
}
