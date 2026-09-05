import { handleAdminJson } from "@/modules/learn/admin.http";
import { adminCreateTag, adminUpdateTag, tagCreateSchema, tagUpdateSchema } from "@/modules/learn/admin.service";
export const runtime = "nodejs";
export const POST = (request: Request) => handleAdminJson(request, tagCreateSchema, adminCreateTag, 201);
export const PATCH = (request: Request) => handleAdminJson(request, tagUpdateSchema, adminUpdateTag);
