import type { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, ApiError } from "@/lib/api-helpers";

// Signup self-assigns USER only. ADMIN is seeded, never claimable (docs/SPEC.md §2).
const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  password: z.string().min(6).max(72),
});

export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = await parseBody(req, signupSchema);
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email,
        passwordHash: await hash(body.password, 10),
        role: "USER",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return ok(user, 201);
  });
}
