import { prisma } from "@/lib/db/prisma";
import { LearnApiError } from "@/modules/learn/learn.errors";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ResolveDemoUserOptions = { optional?: boolean };

type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

export function resolveDemoUser(
  request: Request,
  options: { optional: true },
): Promise<DemoUser | null>;
export function resolveDemoUser(
  request: Request,
  options?: { optional?: false },
): Promise<DemoUser>;
export async function resolveDemoUser(
  request: Request,
  options: ResolveDemoUserOptions = {},
): Promise<DemoUser | null> {
  const userId = request.headers.get("x-demo-user-id")?.trim();
  if (!userId && options.optional) return null;
  if (!userId || !uuidPattern.test(userId)) {
    throw new LearnApiError(
      401,
      "UNAUTHORIZED",
      "A valid x-demo-user-id header is required",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) {
    throw new LearnApiError(
      401,
      "UNAUTHORIZED",
      "A valid x-demo-user-id header is required",
    );
  }
  return user;
}
