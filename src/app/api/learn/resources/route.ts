import { NextRequest, NextResponse } from "next/server";

import { learnErrorResponse } from "@/modules/learn/learn.errors";
import { listPublicResources } from "@/modules/learn/learn.service";
import type { RawResourceListQuery } from "@/modules/learn/learn.types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const rawQuery = Object.fromEntries(
      request.nextUrl.searchParams.entries(),
    ) as RawResourceListQuery;
    const result = await listPublicResources(rawQuery);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return learnErrorResponse(error);
  }
}
