import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

function mappedError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    return new AppError(
      400,
      "VALIDATION_ERROR",
      error.issues[0]?.message ?? "Request validation failed",
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return new AppError(409, "UNIQUE_CONSTRAINT", "A record with these values already exists");
      case "P2003":
        return new AppError(400, "INVALID_REFERENCE", "A referenced record does not exist");
      case "P2025":
        return new AppError(404, "RECORD_NOT_FOUND", "Record not found");
      case "P2034":
        return new AppError(409, "TRANSACTION_CONFLICT", "The request conflicted with another update; please retry");
    }
  }
  return new AppError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred");
}

export function mapApiError(error: unknown) {
  return mappedError(error);
}

export function apiErrorResponse(error: unknown) {
  const requestId = crypto.randomUUID();
  const safe = mappedError(error);
  if (safe.status >= 500) {
    console.error("API request failed", { requestId, code: safe.code });
  }
  return NextResponse.json(
    { success: false, error: { code: safe.code, message: safe.message }, requestId },
    { status: safe.status, headers: { "x-request-id": requestId } },
  );
}
