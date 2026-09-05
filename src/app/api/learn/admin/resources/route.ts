import { handleAdminJson } from "@/modules/learn/admin.http";
import { adminCreateResource, resourceCreateSchema } from "@/modules/learn/admin.service";
export const runtime = "nodejs";
export const POST = (request: Request) => handleAdminJson(request, resourceCreateSchema, adminCreateResource, 201);
