import { handleAdminJson } from "@/modules/learn/admin.http";
import { adminCreateAuthor, adminUpdateAuthor, authorCreateSchema, authorUpdateSchema } from "@/modules/learn/admin.service";
export const runtime = "nodejs";
export const POST = (request: Request) => handleAdminJson(request, authorCreateSchema, adminCreateAuthor, 201);
export const PATCH = (request: Request) => handleAdminJson(request, authorUpdateSchema, adminUpdateAuthor);
