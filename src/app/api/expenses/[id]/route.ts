import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { requireExpense } from "@/lib/access";
import { createExpenseSchema } from "@/app/api/stops/[id]/expenses/route";
import { num } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    const expense = await requireExpense(id, user);
    const body = await parseBody(req, createExpenseSchema.partial());

    if (body.date && (body.date < expense.stop.trip.startDate || body.date > expense.stop.trip.endDate)) {
      throw new ApiError(422, "That date is outside the trip dates");
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        category: body.category,
        description: body.description,
        amount: body.amount,
        date: body.date,
      },
    });

    return ok({ ...updated, amount: num(updated.amount) });
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    await requireExpense(id, user);
    await prisma.expense.delete({ where: { id } });
    return ok({ id });
  });
}
