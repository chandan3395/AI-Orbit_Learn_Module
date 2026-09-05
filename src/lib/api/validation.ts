import { AppError } from "./errors";
import type { z } from "zod";

const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  return schema.parse(value);
}

export async function readJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    throw new AppError(413, "PAYLOAD_TOO_LARGE", "Request body is too large");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new AppError(413, "PAYLOAD_TOO_LARGE", "Request body is too large");
  }
  try {
    return validate(schema, JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid JSON body");
    }
    throw error;
  }
}
