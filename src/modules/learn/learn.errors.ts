import { NextResponse } from "next/server";

export class LearnApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "LearnApiError";
  }
}

export function learnErrorResponse(error: unknown) {
  if (error instanceof LearnApiError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: error.code, message: error.message },
      },
      { status: error.status },
    );
  }

  console.error("Unhandled Learn API error", error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 },
  );
}
