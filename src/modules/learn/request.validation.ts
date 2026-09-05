import { LessonProgressStatus } from "@prisma/client";
import { z } from "zod";

export const progressUpdateSchema = z
  .object({
    status: z.enum([
      LessonProgressStatus.IN_PROGRESS,
      LessonProgressStatus.COMPLETED,
    ]),
    positionSeconds: z.number().int().nonnegative().optional(),
  })
  .strict();
