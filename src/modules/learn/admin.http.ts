import { NextResponse } from "next/server";
import type { z } from "zod";

import { readJsonBody } from "@/lib/api/validation";
import { requireAdmin } from "@/modules/auth/demo-user";

import { learnErrorResponse } from "./learn.errors";

export async function handleAdminJson<T>(request: Request, schema: z.ZodType<T>, action: (input: T) => Promise<unknown>, status = 200) {
  try {
    await requireAdmin(request);
    const input = await readJsonBody(request, schema);
    const data = await action(input);
    return NextResponse.json({ success: true, data }, { status });
  } catch (error) {
    return learnErrorResponse(error);
  }
}

export async function handleAdminAction(request: Request, action: () => Promise<unknown>) {
  try {
    await requireAdmin(request);
    const data = await action();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return learnErrorResponse(error);
  }
}
