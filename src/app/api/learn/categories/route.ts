import { NextResponse } from "next/server";

import { learnErrorResponse } from "@/modules/learn/learn.errors";
import { listPublicCategories } from "@/modules/learn/learn.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await listPublicCategories();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return learnErrorResponse(error);
  }
}
