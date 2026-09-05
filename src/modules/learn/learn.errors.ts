import { AppError, apiErrorResponse } from "@/lib/api/errors";

export class LearnApiError extends AppError {
  constructor(status: number, code: string, message: string) {
    super(status, code, message);
    this.name = "LearnApiError";
  }
}

export const learnErrorResponse = apiErrorResponse;
