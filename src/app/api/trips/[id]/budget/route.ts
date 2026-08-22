import type { NextRequest } from "next/server";
import { handle, ok, requireRole } from "@/lib/api-helpers";
import { requireTrip } from "@/lib/access";
import { tripBudget } from "@/lib/budget";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    await requireTrip(id, user);
    return ok(await tripBudget(id));
  });
}
