import type { NextRequest } from "next/server";
import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requireRole, ApiError } from "@/lib/api-helpers";
import { requireStop } from "@/lib/access";
import { dayString, money, num } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export const createExpenseSchema = z.object({
  category: z.enum(ExpenseCategory),
  description: z.string().trim().min(1).max(120),
  amount: money,
  date: dayString.optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    await requireStop(id, user);
    const rows = await prisma.expense.findMany({
      where: { stopId: id },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });
    return ok({ rows: rows.map((r) => ({ ...r, amount: num(r.amount) })) });
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { user } = await requireRole();
    const { id } = await params;
    const stop = await requireStop(id, user);
    const body = await parseBody(req, createExpenseSchema);

    // A dated expense must sit inside the trip (not the stop — a flight booked
    // on the trip's first day belongs to the stop that pays for it).
    if (body.date && (body.date < stop.trip.startDate || body.date > stop.trip.endDate)) {
      throw new ApiError(422, "That date is outside the trip dates");
    }

    const expense = await prisma.expense.create({
      data: {
        stopId: id,
        category: body.category,
        description: body.description,
        amount: body.amount,
        date: body.date ?? undefined,
      },
    });

    return ok({ ...expense, amount: num(expense.amount) }, 201);
  });
}
