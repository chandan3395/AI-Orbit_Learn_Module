import { handleAdminJson } from "@/modules/learn/admin.http";
import { adminCreateCategory, adminUpdateCategory, categoryCreateSchema, categoryUpdateSchema } from "@/modules/learn/admin.service";
export const runtime = "nodejs";
export const POST = (request: Request) => handleAdminJson(request, categoryCreateSchema, adminCreateCategory, 201);
export const PATCH = (request: Request) => handleAdminJson(request, categoryUpdateSchema, adminUpdateCategory);
