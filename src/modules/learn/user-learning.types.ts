import type { EnrollmentStatus } from "@prisma/client";

export type ProgressUpdateInput = {
  status: "IN_PROGRESS" | "COMPLETED";
  positionSeconds?: number;
};

export type MyLearningQuery = {
  status?: EnrollmentStatus;
  page: number;
  limit: number;
};

export type RawMyLearningQuery = {
  status?: string;
  page?: string;
  limit?: string;
};
